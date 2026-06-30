const DIETA = [
  {
    momento: 'Desayuno',
    desc: 'Café con leche semidesnatada · 3 huevos · 40 g lomo embuchado o 150 g claras'
  },
  {
    momento: 'Comida',
    desc: '250 g pechuga de pollo · 150 g arroz cocido o 250 g patata cocida · Champiñones, cebolla y calabacín'
  },
  {
    momento: 'Merienda',
    desc: 'Cortado · Coca-Cola Zero si tienes hambre'
  },
  {
    momento: 'Cena',
    desc: '250 g pollo o pescado blanco · Ensalada grande · Champiñones, espárragos · 20 g queso rallado (opcional)'
  },
  {
    momento: 'Hidratación',
    desc: '3-4 litros de agua al día'
  },
];

const PLAN = {
  lunes: {
    tipo: 'Descanso / Tu rutina',
    emoji: '💪',
    ejercicios: [
      { nombre: 'Calentamiento', detalle: '5-10 min en cinta o bici' },
      { nombre: 'Estiramientos', detalle: '5-10 min' },
    ],
    comidas: DIETA,
  },
  martes: {
    tipo: 'Pierna + Cardio',
    emoji: '🦵',
    ejercicios: [
      { nombre: 'Prensa de piernas', detalle: '4 series × 10 reps' },
      { nombre: 'Extensión de cuádriceps', detalle: '3 series × 12 reps' },
      { nombre: 'Curl femoral', detalle: '4 series × 10-12 reps' },
      { nombre: 'Hip thrust (glúteo)', detalle: '3 series × 10 reps' },
      { nombre: 'Elevación de gemelos', detalle: '4 series × 15 reps' },
      { nombre: 'Cardio — caminata suave', detalle: '20 min' },
    ],
    comidas: DIETA,
  },
  miercoles: {
    tipo: 'Pecho + Tríceps + Cardio',
    emoji: '🦅',
    ejercicios: [
      { nombre: 'Press de banca', detalle: '4 series × 6-8 reps' },
      { nombre: 'Press inclinado', detalle: '3 series × 8-10 reps' },
      { nombre: 'Aperturas de pecho', detalle: '3 series × 12-15 reps' },
      { nombre: 'Extensión de tríceps en polea', detalle: '4 series × 10-12 reps' },
      { nombre: 'Extensión de tríceps sobre cabeza', detalle: '3 series × 10-12 reps' },
      { nombre: 'Cardio — cinta inclinada', detalle: '25-30 min' },
    ],
    comidas: DIETA,
  },
  jueves: {
    tipo: 'Espalda + Bíceps + Cardio',
    emoji: '🏋️',
    ejercicios: [
      { nombre: 'Jalón al pecho', detalle: '4 series × 8-10 reps' },
      { nombre: 'Remo en polea sentado', detalle: '4 series × 10-12 reps' },
      { nombre: 'Remo con pecho apoyado', detalle: '3 series × 10-12 reps' },
      { nombre: 'Pullover en polea', detalle: '3 series × 12-15 reps' },
      { nombre: 'Curl de bíceps', detalle: '3 series × 8-10 reps' },
      { nombre: 'Curl martillo', detalle: '3 series × 10-12 reps' },
      { nombre: 'Cardio — cinta inclinada', detalle: '30 min · inclinación 5-8% · 5,5-6 km/h' },
    ],
    comidas: DIETA,
  },
  viernes: {
    tipo: 'Hombro + Abdomen + Cardio',
    emoji: '🔥',
    ejercicios: [
      { nombre: 'Press de hombros', detalle: '4 series × 8-10 reps' },
      { nombre: 'Elevaciones laterales', detalle: '4 series × 12-15 reps' },
      { nombre: 'Pájaro (deltoides posterior)', detalle: '3 series × 12-15 reps' },
      { nombre: 'Crunch en polea', detalle: '4 series × 15 reps' },
      { nombre: 'Plancha', detalle: '3 series × 45-60 segundos' },
      { nombre: 'Cardio — caminata', detalle: '35-40 min' },
    ],
    comidas: DIETA,
  },
  sabado: {
    tipo: 'Pasos — Sin gimnasio',
    emoji: '🚶',
    ejercicios: [
      { nombre: 'Caminar — objetivo de pasos', detalle: '10.000 - 12.000 pasos' },
    ],
    comidas: DIETA,
  },
  domingo: {
    tipo: 'Descanso total',
    emoji: '😴',
    ejercicios: [
      { nombre: 'Descanso — deja que el cuerpo se recupere', detalle: '' },
      { nombre: 'Opcional: caminata suave', detalle: '20-30 min' },
    ],
    comidas: DIETA,
  },
};
