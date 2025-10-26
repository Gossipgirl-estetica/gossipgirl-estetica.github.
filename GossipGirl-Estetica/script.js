// -------------------- Firebase --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAfefy3IN0F1veEg2T_2CkrhnO8lMLKxOs",
  authDomain: "gossipgirl-estetica.firebaseapp.com",
  projectId: "gossipgirl-estetica",
  storageBucket: "gossipgirl-estetica.firebasestorage.app",
  messagingSenderId: "98490602543",
  appId: "1:98490602543:web:1aea8ddbc6984692dfe2da",
  measurementId: "G-YFR3EK7TQW"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// -------------------- Datos de servicios --------------------
const servicios = {
  magali: [
    { nombre: 'Perfilado de Cejas', precio: 0, img: 'images/cejas.jpg' },
    { nombre: 'Lifting', precio: 12000, img: 'images/lifting.jpg' },
    { nombre: 'Pestañas Extensiones Clásicas', precio: 15000, img: 'images/ext_clasicas.jpg' },
    { nombre: 'Pestañas Extensiones Brasileñas', precio: 18000, img: 'images/ext_brasil.jpg' },
    { nombre: 'Pestañas Extensiones Hawaianas', precio: 17000, img: 'images/ext_hawai.jpg' },
    { nombre: 'Pestañas Tecnológicas', precio: 17000, img: 'images/ext_tecnologicas.jpg' },
  ],
  mariana: [
    { nombre: 'Uñas Permanentes', precio: 0, img: 'images/unas_perm.jpg' },
    { nombre: 'Uñas Semi Permanentes', precio: 0, img: 'images/unas_semi.jpg' },
  ]
};

// -------------------- Función para obtener parámetro de URL --------------------
function obtenerParametroURL(nombre) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(nombre);
}

// -------------------- Cargar servicios según URL --------------------
function cargarServiciosDesdeURL() {
  const container = document.getElementById('servicios-container');
  const titulo = document.getElementById('titulo-servicios');
  const profesional = obtenerParametroURL('prof');

  if (!profesional || !servicios[profesional]) {
    alert('Profesional no seleccionado. Volviendo a la página principal.');
    window.location.href = 'index.html';
    return;
  }

  titulo.textContent = profesional === 'magali' ? 'Servicios de Magali' : 'Servicios de Mariana';

  servicios[profesional].forEach(servicio => {
    const card = document.createElement('div');
    card.classList.add('servicio-card');
    card.innerHTML = `
      <img src="${servicio.img}" alt="${servicio.nombre}">
      <h3>${servicio.nombre}</h3>
      <p>${servicio.precio > 0 ? '$' + servicio.precio : 'Consultar precio'}</p>

      <label>Fecha:</label>
      <input type="date" id="fecha-${servicio.nombre.replace(/\s/g,'')}" min="${new Date().toISOString().split('T')[0]}">

      <label>Hora:</label>
      <input type="time" id="hora-${servicio.nombre.replace(/\s/g,'')}" min="09:00" max="19:00">

      <button onclick="reservar('${profesional}','${servicio.nombre}')">Reservar</button>
      <button class="cancelar" onclick="cancelar('${profesional}','${servicio.nombre}')">Cancelar</button>
    `;
    container.appendChild(card);
  });
}

// -------------------- Funciones Reservar y Cancelar --------------------
async function reservar(profesional, nombre) {
  const fecha = document.getElementById(`fecha-${nombre.replace(/\s/g,'')}`).value;
  const hora = document.getElementById(`hora-${nombre.replace(/\s/g,'')}`).value;

  if (!fecha || !hora) { alert('Por favor seleccioná fecha y hora.'); return; }

  const turnoRef = db.collection('turnos');
  const querySnapshot = await turnoRef
    .where('profesional', '==', profesional)
    .where('nombre', '==', nombre)
    .where('fecha', '==', fecha)
    .where('hora', '==', hora)
    .get();

  if (!querySnapshot.empty) { alert('Este turno ya está reservado.'); return; }

  await turnoRef.add({
    profesional,
    nombre,
    fecha,
    hora,
    estado: 'reservado'
  });

  alert(`Turno reservado: ${nombre} el ${fecha} a las ${hora}`);
}

async function cancelar(profesional, nombre) {
  const fecha = document.getElementById(`fecha-${nombre.replace(/\s/g,'')}`).value;
  const hora = document.getElementById(`hora-${nombre.replace(/\s/g,'')}`).value;

  const turnoRef = db.collection('turnos');
  const querySnapshot = await turnoRef
    .where('profesional', '==', profesional)
    .where('nombre', '==', nombre)
    .where('fecha', '==', fecha)
    .where('hora', '==', hora)
    .get();

  if (querySnapshot.empty) { alert('No existe un turno reservado en esa fecha y hora.'); return; }

  querySnapshot.forEach(async (doc) => {
    await turnoRef.doc(doc.id).delete();
  });

  alert(`Turno cancelado: ${nombre} el ${fecha} a las ${hora}`);
}

// -------------------- Panel en tiempo real --------------------
function mostrarTurnosPanel() {
  const container = document.getElementById('turnos-container');
  if(!container) return;

  container.innerHTML = '';

  db.collection('turnos').orderBy('fecha').orderBy('hora')
    .onSnapshot((snapshot) => {
      container.innerHTML = '';
      if(snapshot.empty) { container.innerHTML = '<p>No hay turnos registrados aún.</p>'; return; }

      snapshot.forEach(doc => {
        const turno = doc.data();
        const card = document.createElement('div');
        card.classList.add('turno-card', turno.estado);
        card.innerHTML = `
          <h3>${turno.nombre}</h3>
          <p><strong>Profesional:</strong> ${turno.profesional}</p>
          <p><strong>Fecha:</strong> ${turno.fecha}</p>
          <p><strong>Hora:</strong> ${turno.hora}</p>
          <p><strong>Estado:</strong> ${turno.estado}</p>
          <button onclick="cambiarEstado('${doc.id}','${turno.estado}')">Cambiar estado</button>
        `;
        container.appendChild(card);
      });
    });
}

async function cambiarEstado(docId, estadoActual) {
  const nuevoEstado = estadoActual === 'reservado' ? 'cancelado' : 'reservado';
  await db.collection('turnos').doc(docId).update({ estado: nuevoEstado });
}
