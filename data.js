// Calorías calculadas para 86 kg, dieta y rutina reales del usuario
// TDEE estimado: ~2000 kcal días descanso, ~2400 días entrenamiento

const DIETA = [
  {
    momento: 'Desayuno',
    desc: 'Café con leche semidesnatada · 3 huevos · 40 g lomo embuchado o 150 g claras',
    kcal: 375
    // Café con leche 70 + 3 huevos 210 + lomo 110 ≈ 390 / claras 75 ≈ 355 → media 375
  },
  {
    momento: 'Comida',
    desc: '250 g pechuga de pollo · 150 g arroz cocido o 250 g patata cocida · Champiñones, cebolla y calabacín',
    kcal: 565
    // Pollo 275 + arroz 195 / patata 200 + verduras 60 + condimentos 35 ≈ 565
  },
  {
    momento: 'Merienda',
    desc: 'Cortado · Coca-Cola Zero si tienes hambre',
    kcal: 35
    // Cortado 35 + Zero 0
  },
  {
    momento: 'Cena',
    desc: '250 g pollo o pescado blanco · Ensalada grande · Champiñones, espárragos · 20 g queso rallado (opcional)',
    kcal: 375
    // Pollo 275 / pescado 175 + ensalada 35 + verduras 30 + queso 75 → media 375
  },
  {
    momento: 'Hidratación',
    desc: '3-4 litros de agua al día',
    kcal: 0
  },
];

const PLAN = {
  lunes: {
    tipo: 'Descanso / Tu rutina',
    emoji: '💪',
    ejercicios: [
      { nombre: 'Calentamiento', detalle: '5-10 min en cinta o bici', kcal: 50 },
      { nombre: 'Estiramientos', detalle: '5-10 min', kcal: 25 },
    ],
    comidas: DIETA,
  },
  martes: {
    tipo: 'Pierna + Cardio',
    emoji: '🦵',
    ejercicios: [
      { nombre: 'Prensa de piernas', detalle: '4 series × 10 reps', kcal: 90 },
      { nombre: 'Extensión de cuádriceps', detalle: '3 series × 12 reps', kcal: 55 },
      { nombre: 'Curl femoral', detalle: '4 series × 10-12 reps', kcal: 65 },
      { nombre: 'Hip thrust (glúteo)', detalle: '3 series × 10 reps', kcal: 55 },
      { nombre: 'Elevación de gemelos', detalle: '4 series × 15 reps', kcal: 40 },
      { nombre: 'Cardio — caminata suave', detalle: '20 min', kcal: 120 },
    ],
    comidas: DIETA,
  },
  miercoles: {
    tipo: 'Pecho + Tríceps + Cardio',
    emoji: '🦅',
    ejercicios: [
      { nombre: 'Press de banca', detalle: '4 series × 6-8 reps', kcal: 90 },
      { nombre: 'Press inclinado', detalle: '3 series × 8-10 reps', kcal: 70 },
      { nombre: 'Aperturas de pecho', detalle: '3 series × 12-15 reps', kcal: 55 },
      { nombre: 'Extensión de tríceps en polea', detalle: '4 series × 10-12 reps', kcal: 65 },
      { nombre: 'Extensión de tríceps sobre cabeza', detalle: '3 series × 10-12 reps', kcal: 55 },
      { nombre: 'Cardio — cinta inclinada', detalle: '25-30 min', kcal: 215 },
    ],
    comidas: DIETA,
  },
  jueves: {
    tipo: 'Espalda + Bíceps + Cardio',
    emoji: '🏋️',
    ejercicios: [
      { nombre: 'Jalón al pecho', detalle: '4 series × 8-10 reps', kcal: 85 },
      { nombre: 'Remo en polea sentado', detalle: '4 series × 10-12 reps', kcal: 80 },
      { nombre: 'Remo con pecho apoyado', detalle: '3 series × 10-12 reps', kcal: 70 },
      { nombre: 'Pullover en polea', detalle: '3 series × 12-15 reps', kcal: 55 },
      { nombre: 'Curl de bíceps', detalle: '3 series × 8-10 reps', kcal: 50 },
      { nombre: 'Curl martillo', detalle: '3 series × 10-12 reps', kcal: 50 },
      { nombre: 'Cardio — cinta inclinada', detalle: '30 min · inclinación 5-8% · 5,5-6 km/h', kcal: 250 },
    ],
    comidas: DIETA,
  },
  viernes: {
    tipo: 'Hombro + Abdomen + Cardio',
    emoji: '🔥',
    ejercicios: [
      { nombre: 'Press de hombros', detalle: '4 series × 8-10 reps', kcal: 80 },
      { nombre: 'Elevaciones laterales', detalle: '4 series × 12-15 reps', kcal: 65 },
      { nombre: 'Pájaro (deltoides posterior)', detalle: '3 series × 12-15 reps', kcal: 55 },
      { nombre: 'Crunch en polea', detalle: '4 series × 15 reps', kcal: 60 },
      { nombre: 'Plancha', detalle: '3 series × 45-60 segundos', kcal: 45 },
      { nombre: 'Cardio — caminata', detalle: '35-40 min', kcal: 220 },
    ],
    comidas: DIETA,
  },
  sabado: {
    tipo: 'Pasos — Sin gimnasio',
    emoji: '🚶',
    ejercicios: [
      { nombre: 'Caminar — objetivo de pasos', detalle: '10.000 - 12.000 pasos', kcal: 480 },
    ],
    comidas: DIETA,
  },
  domingo: {
    tipo: 'Descanso total',
    emoji: '😴',
    ejercicios: [
      { nombre: 'Descanso — deja que el cuerpo se recupere', detalle: '', kcal: 0 },
      { nombre: 'Opcional: caminata suave', detalle: '20-30 min', kcal: 120 },
    ],
    comidas: DIETA,
  },
};

// Calorías totales de la dieta completa
const KCAL_DIETA_TOTAL = DIETA.reduce((s, m) => s + m.kcal, 0); // ~1350 kcal

// TDEE estimado para 86 kg con actividad moderada
const TDEE_ESTIMADO = 2100;

// Objetivo: déficit mínimo de 500 kcal/día
const META_DEFICIT = 500;
