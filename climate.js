console.log("CLIMATE SYSTEM INITIALIZED");

document.addEventListener("DOMContentLoaded", function () {

  const container = document.getElementById("globeContainer");
  const fixedHeight = window.innerHeight - 70;

  // =========================
  // SCENE SETUP
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

  const globeMaterial = new THREE.MeshPhongMaterial({
    map: globeTexture
  });

  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  scene.add(globe);

  // =========================
  // STARS (COLORFUL + ROUND)
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

    if (type < 0.33) {
      colors.push(0.6, 0.8, 1);     // blue
    } else if (type < 0.66) {
      colors.push(1, 0.95, 0.7);    // yellow
    } else {
      colors.push(1, 1, 1);         // white
    }
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  starGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const starMaterial = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

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
  // MARKER SYSTEM (FIXED)
  // =========================
  let currentMarker = null;

  function addMarker(x, y, z) {

    if (currentMarker) {
      scene.remove(currentMarker);
    }

    const markerGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff // CYAN
    });

    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(x, y, z);

    scene.add(marker);
    currentMarker = marker;
  }

  // =========================
  // CAMERA FOCUS (FIXED MATH)
  // =========================
  function focusOnLocation(lat, lon) {

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

    addMarker(x, y, z);
  }

  // =========================
  // WEATHER SYSTEM
  // =========================
  const API_KEY = "0c80052eedfed3154685e0d29bba101a";
  let interval;

  async function fetchData(city) {

    try {

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );

      const data = await res.json();
      if (data.cod !== 200) return alert(data.message);

      const temp = data.main.temp;

      document.getElementById("temperature").innerText = temp + " °C";

      const globalWarming = (1.1 + Math.random() * 0.5).toFixed(2);
      document.getElementById("warming").innerText = globalWarming + " °C";

      document.getElementById("lastUpdate").innerText =
        "Last Transmission: " + new Date().toLocaleTimeString();

      focusOnLocation(data.coord.lat, data.coord.lon);

      addFeed(city, temp);

    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // HISTORY FEED (FIXED)
  // =========================
  function addFeed(city, temp) {

    const feed = document.getElementById("feed");

    const entry = document.createElement("div");
    entry.className = "feed-entry";

    entry.innerHTML =
      `[${new Date().toLocaleTimeString()}] ` +
      `${city.toUpperCase()} — ${temp}°C`;

    feed.prepend(entry);

    if (feed.children.length > 30) {
      feed.removeChild(feed.lastChild);
    }
  }

  // =========================
  // BUTTON
  // =========================
  document.getElementById("scanBtn")
    .addEventListener("click", function () {

      const city = document.getElementById("cityInput").value.trim();
      if (!city) return alert("Enter a city.");

      fetchData(city);

      clearInterval(interval);
      interval = setInterval(() => fetchData(city), 5000); // 5 seconds
    });

});