console.log("CLIMATE SYSTEM INITIALIZED");

document.addEventListener("DOMContentLoaded", function () {

  const container = document.getElementById("globeContainer");
  const fixedHeight = window.innerHeight - 70;

  // =========================
  // COUNTRY → MAJOR CITY MAP
  // =========================
  const countryMajorCities = {
    "Israel": "Tel Aviv",
    "United States": "New York",
    "Iran": "Tehran",
    "Iraq": "Baghdad",
    "Syria": "Damascus",
    "Lebanon": "Beirut",
    "Yemen": "Sana'a",
    "Saudi Arabia": "Riyadh",
    "United Arab Emirates": "Dubai",
    "UAE": "Dubai",
    "Kuwait": "Kuwait City",
    "Qatar": "Doha"
  };

  // =========================
  // THREE.JS SCENE SETUP
  // =========================
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / fixedHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setSize(container.clientWidth, fixedHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);
  camera.position.set(0, 0, 12);

  // =========================
  // GLOBE
  // =========================
  const radius = 5;
  const globeGeometry = new THREE.SphereGeometry(radius, 128, 128);
  const globeTexture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
  );
  const globeMaterial = new THREE.MeshPhongMaterial({ map: globeTexture });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  scene.add(globe);

  // =========================
  // LAT/LON GRID
  // =========================
  const gridGroup = new THREE.Group();
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0x44aaff,
    transparent: true,
    opacity: 0.25
  });

  for (let lat = -80; lat <= 80; lat += 20) {
    const points = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
  }

  for (let lon = -180; lon < 180; lon += 20) {
    const points = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
  }
  scene.add(gridGroup);

  // =========================
  // STARS
  // =========================
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 4000;
  const positions = [];
  const colors = [];

  for (let i = 0; i < starCount; i++) {
    const spread = 400;
    positions.push(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );

    const type = Math.random();
    if (type < 0.33) colors.push(0.6, 0.8, 1);
    else if (type < 0.66) colors.push(1, 0.95, 0.7);
    else colors.push(1, 1, 1);
  }

  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  starGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const starMaterial = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, sizeAttenuation: true });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  // =========================
  // LIGHTING
  // =========================
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.5));

  // =========================
  // CONTROLS
  // =========================
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 20;

  // =========================
  // ANIMATION LOOP
  // =========================
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // =========================
  // MARKER SYSTEM
  // =========================
  let currentMarker = null;

  function addMarker(x, y, z, color = 0x00ffff) {
    if (currentMarker) scene.remove(currentMarker);

    const markerGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(x, y, z);
    scene.add(marker);
    currentMarker = marker;
  }

  // =========================
  // CAMERA FOCUS
  // =========================
  function focusOnLocation(lat, lon, color = 0x00ffff) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    gsap.to(camera.position, {
      x: x * 2,
      y: y * 2,
      z: z * 2,
      duration: 1.5,
      onUpdate: () => camera.lookAt(0, 0, 0)
    });

    addMarker(x, y, z, color);
  }

  // =========================
  // WEATHER SYSTEM
  // =========================
  const API_KEY = "YOUR_WEATHER_API_KEY HERE";
  let interval;

  async function fetchData(input) {
    try {
      let apiCity = input.trim();
      if (countryMajorCities[input]) apiCity = countryMajorCities[input];

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      if (data.cod !== 200) return alert(data.message);

      const temp = data.main.temp;
      const lat = data.coord.lat;
      const lon = data.coord.lon;

      // Update stats
      const latEl = document.getElementById("latitude");
      const lonEl = document.getElementById("longitude");
      const tempEl = document.getElementById("temperature");
      const warmingEl = document.getElementById("warming");
      const bar = document.getElementById("warmingFill");
      const lastUpdateEl = document.getElementById("lastUpdate");

      if (tempEl) tempEl.innerText = temp + " °C";
      if (latEl) latEl.innerText = lat.toFixed(2) + "°";
      if (lonEl) lonEl.innerText = lon.toFixed(2) + "°";

      const currentGlobalIncrease = 1.2;
      const parisLimit = 1.5;
      const warmingPercent = ((currentGlobalIncrease / parisLimit) * 100).toFixed(1);

      if (warmingEl) warmingEl.innerText = warmingPercent + " %";
      if (bar) bar.style.width = warmingPercent + "%";
      if (lastUpdateEl) lastUpdateEl.innerText = "Last Transmission: " + new Date().toLocaleTimeString();

      // Always cyan marker
      focusOnLocation(lat, lon);

      // Update feed
      addFeed(input, temp);

    } catch (err) {
      console.error(err);
      alert("Error fetching weather data. Check city/country spelling.");
    }
  }

  // =========================
  // HISTORY FEED
  // =========================
  function addFeed(input, temp) {
    const feed = document.getElementById("feed");
    const entry = document.createElement("div");
    entry.className = "feed-entry";
    entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${input.toUpperCase()} — ${temp}°C`;
    feed.prepend(entry);
    if (feed.children.length > 30) feed.removeChild(feed.lastChild);
  }

  // =========================
  // SCAN BUTTON
  // =========================
  document.getElementById("scanBtn").addEventListener("click", function () {
    const input = document.getElementById("cityInput").value.trim();
    if (!input) return alert("Enter a city or country.");

    fetchData(input);

    clearInterval(interval);
    interval = setInterval(() => fetchData(input), 5000);
  });

  // =========================
  // DRAGGABLE COORDS PANEL
  // =========================
  const coordsPanel = document.getElementById("coordsPanel");
  let isDragging = false;
  let offsetX, offsetY;

  coordsPanel.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - coordsPanel.offsetLeft;
    offsetY = e.clientY - coordsPanel.offsetTop;
    coordsPanel.style.position = "absolute";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    coordsPanel.style.left = (e.clientX - offsetX) + "px";
    coordsPanel.style.top = (e.clientY - offsetY) + "px";
  });

  document.addEventListener("mouseup", () => { isDragging = false; });

});