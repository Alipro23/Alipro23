console.log("CLIMATE SYSTEM INITIALIZED");

document.addEventListener("DOMContentLoaded", function () {

const container = document.getElementById("globeContainer");
const fixedHeight = window.innerHeight - 70;

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// =========================
// HIGH RISK COUNTRIES
// =========================

const redMarkerCountries = [
"Israel","Iran","Iraq","Syria","Lebanon","Yemen",
"Saudi Arabia","United Arab Emirates","UAE",
"Kuwait","Qatar","Palestine"
];

// =========================
// COUNTRY → CITY MAP
// =========================

const countryMajorCities = {
"Israel":"Tel Aviv",
"Iran":"Tehran",
"Iraq":"Baghdad",
"Syria":"Damascus",
"Lebanon":"Beirut",
"Yemen":"Sana'a",
"Saudi Arabia":"Riyadh",
"United Arab Emirates":"Dubai",
"UAE":"Dubai",
"Kuwait":"Kuwait City",
"Qatar":"Doha"
};

// =========================
// THREE SCENE
// =========================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
60,
container.clientWidth / fixedHeight,
0.1,
1000
);

const renderer = new THREE.WebGLRenderer({
antialias:true,
alpha:true
});

renderer.setSize(container.clientWidth,fixedHeight);

renderer.setPixelRatio(
isMobile
? Math.min(window.devicePixelRatio,1.5)
: window.devicePixelRatio
);

renderer.setClearColor(0x000000,1);

container.appendChild(renderer.domElement);

camera.position.set(0,0,12);

// =========================
// GLOBE
// =========================

const radius = 5;

const globeGeometry = new THREE.SphereGeometry(
radius,
isMobile ? 64 : 128,
isMobile ? 64 : 128
);

const globeTexture = new THREE.TextureLoader().load(
"https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
);

const globeMaterial = new THREE.MeshPhongMaterial({ map: globeTexture });

const globe = new THREE.Mesh(globeGeometry, globeMaterial);

scene.add(globe);

// =========================
// STARS
// =========================

const starGeometry = new THREE.BufferGeometry();
const starCount = isMobile ? 1500 : 4000;

const positions = [];
const colors = [];

for (let i = 0; i < starCount; i++) {

const spread = 400;

positions.push(
(Math.random()-0.5)*spread,
(Math.random()-0.5)*spread,
(Math.random()-0.5)*spread
);

const type = Math.random();

if(type<0.33) colors.push(0.6,0.8,1);
else if(type<0.66) colors.push(1,0.95,0.7);
else colors.push(1,1,1);

}

starGeometry.setAttribute(
"position",
new THREE.Float32BufferAttribute(positions,3)
);

starGeometry.setAttribute(
"color",
new THREE.Float32BufferAttribute(colors,3)
);

const starMaterial = new THREE.PointsMaterial({
size:isMobile?0.6:0.8,
vertexColors:true,
sizeAttenuation:true
});

scene.add(new THREE.Points(starGeometry,starMaterial));

// =========================
// LIGHTING
// =========================

scene.add(new THREE.AmbientLight(0xffffff,1.4));

const dirLight = new THREE.DirectionalLight(0xffffff,0.5);
dirLight.position.set(5,3,5);

scene.add(dirLight);

// =========================
// CONTROLS
// =========================

const controls = new THREE.OrbitControls(camera,renderer.domElement);

controls.enableDamping = true;
controls.enablePan = false;

controls.minDistance = 7;
controls.maxDistance = 20;

controls.rotateSpeed = isMobile ? 0.7 : 0.8;
controls.zoomSpeed = isMobile ? 0.5 : 0.6;

// =========================
// ANIMATION
// =========================

function animate(){

requestAnimationFrame(animate);

controls.update();

renderer.render(scene,camera);

}

animate();

// =========================
// MARKER SYSTEM
// =========================

let currentMarker = null;

function addMarker(x,y,z,color=0x00ffff){

if(currentMarker) scene.remove(currentMarker);

const markerGeometry = new THREE.SphereGeometry(0.25,32,32);
const markerMaterial = new THREE.MeshBasicMaterial({color});

const marker = new THREE.Mesh(markerGeometry,markerMaterial);

marker.position.set(x,y,z);

scene.add(marker);

currentMarker = marker;

}

// =========================
// CAMERA FOCUS
// =========================

function focusOnLocation(lat,lon,color=0x00ffff){

const phi = (90-lat)*(Math.PI/180);
const theta = (lon+180)*(Math.PI/180);

const x = -(radius*Math.sin(phi)*Math.cos(theta));
const y = radius*Math.cos(phi);
const z = radius*Math.sin(phi)*Math.sin(theta);

gsap.to(camera.position,{
x:x*2,
y:y*2,
z:z*2,
duration:1.5,
onUpdate:()=>camera.lookAt(0,0,0)
});

addMarker(x,y,z,color);

}

// =========================
// WEATHER SYSTEM
// =========================

const API_KEY = "0c80052eedfed3154685e0d29bba101a";

let interval;

async function fetchData(input){

try{

let apiCity = input.trim();

if(countryMajorCities[input])
apiCity = countryMajorCities[input];

const res = await fetch(
`https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&appid=${API_KEY}&units=metric`
);

const data = await res.json();

if(data.cod!==200) return alert(data.message);

const temp = data.main.temp;
const lat = data.coord.lat;
const lon = data.coord.lon;
const country = data.sys ? data.sys.country : "";

document.getElementById("temperature").innerText = temp+" °C";
document.getElementById("latitude").innerText = lat.toFixed(2)+"°";
document.getElementById("longitude").innerText = lon.toFixed(2)+"°";

const warmingPercent = ((1.2/1.5)*100).toFixed(1);

document.getElementById("warming").innerText = warmingPercent+" %";
document.getElementById("warmingFill").style.width = warmingPercent+"%";

document.getElementById("lastUpdate").innerText =
"Last Transmission: "+new Date().toLocaleTimeString();

let markerColor = 0x00ffff;

if(redMarkerCountries.includes(input) || redMarkerCountries.includes(country))
markerColor = 0xff0000;

focusOnLocation(lat,lon,markerColor);

addFeed(input,temp);

}catch(err){

console.error(err);
alert("Error fetching weather data.");

}

}

// =========================
// HISTORY FEED
// =========================

function addFeed(input,temp){

const feed = document.getElementById("feed");

const entry = document.createElement("div");

entry.className = "feed-entry";

entry.innerHTML =
`[${new Date().toLocaleTimeString()}] ${input.toUpperCase()} — ${temp}°C`;

feed.prepend(entry);

if(feed.children.length>30)
feed.removeChild(feed.lastChild);

}

// =========================
// SCAN BUTTON
// =========================

document.getElementById("scanBtn").addEventListener("click",function(){

const input = document.getElementById("cityInput").value.trim();

if(!input) return alert("Enter a city or country.");

fetchData(input);

clearInterval(interval);

interval = setInterval(()=>fetchData(input),5000);

});

// =========================
// DRAGGABLE COORDS PANEL
// =========================

const coordsPanel = document.getElementById("coordsPanel");

let isDragging = false;
let offsetX,offsetY;

coordsPanel.addEventListener("mousedown",(e)=>{

isDragging = true;

offsetX = e.clientX - coordsPanel.offsetLeft;
offsetY = e.clientY - coordsPanel.offsetTop;

coordsPanel.style.position="absolute";

});

document.addEventListener("mousemove",(e)=>{

if(!isDragging) return;

coordsPanel.style.left = (e.clientX-offsetX)+"px";
coordsPanel.style.top = (e.clientY-offsetY)+"px";

});

document.addEventListener("mouseup",()=>{

isDragging=false;

});

// =========================
// RESIZE SUPPORT
// =========================

window.addEventListener("resize",()=>{

const newHeight = window.innerHeight-70;

camera.aspect = container.clientWidth/newHeight;

camera.updateProjectionMatrix();

renderer.setSize(container.clientWidth,newHeight);

});

});