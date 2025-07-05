import type { Question, PrizeTier } from './types';

export const PRIZE_TIERS: PrizeTier[] = [
  // 1-5
  { amount: 1000, label: '1.000', isCheckpoint: false },
  { amount: 2000, label: '2.000', isCheckpoint: false },
  { amount: 3000, label: '3.000', isCheckpoint: false },
  { amount: 4000, label: '4.000', isCheckpoint: false },
  { amount: 5000, label: '5.000', isCheckpoint: true },
  // 6-10
  { amount: 10000, label: '10.000', isCheckpoint: false },
  { amount: 20000, label: '20.000', isCheckpoint: false },
  { amount: 30000, label: '30.000', isCheckpoint: false },
  { amount: 40000, label: '40.000', isCheckpoint: false },
  { amount: 50000, label: '50.000', isCheckpoint: true },
  // 11-15
  { amount: 100000, label: '100.000', isCheckpoint: false },
  { amount: 200000, label: '200.000', isCheckpoint: false },
  { amount: 300000, label: '300.000', isCheckpoint: false },
  { amount: 400000, label: '400.000', isCheckpoint: false },
  { amount: 500000, label: '500.000', isCheckpoint: true },
  // 16
  { amount: 1000000, label: '1 MILHÃO', isCheckpoint: false },
];

export const QUESTIONS: Question[] = [
  {
    question: 'Qual Bicho transmite a Doença de Chagas?',
    options: { A: 'Abelha', B: 'Barata', C: 'Pulga', D: 'Barbeiro' },
    correctAnswerKey: 'D',
  },
  {
    question: 'Qual fruto é conhecido no Norte e Nordeste como "jerimum"?',
    options: { A: 'Caju', B: 'Abóbora', C: 'Chuchu', D: 'Coco' },
    correctAnswerKey: 'B',
  },
  {
    question: 'Qual é o coletivo de cães?',
    options: { A: 'Manada', B: 'Alcateia', C: 'Matilha', D: 'Rebanho' },
    correctAnswerKey: 'C',
  },
  {
    question: 'Qual é o triângulo que tem todos os lados diferentes?',
    options: { A: 'Equilátero', B: 'Isósceles', C: 'Escaleno', D: 'Trapézio' },
    correctAnswerKey: 'C',
  },
  {
    question: 'Quem compôs o Hino da Independência?',
    options: { A: 'Dom Pedro I', B: 'Manuel Bandeira', C: 'Castro Alves', D: 'Carlos Gomes' },
    correctAnswerKey: 'A',
  },
  {
    question: 'Qual o metal mais caro do mundo?',
    options: { A: 'Ouro', B: 'Ródio', C: 'Platina', D: 'Paládio' },
    correctAnswerKey: 'B',
  },
  {
    question: 'Qual das alternativas abaixo é um dos sete pecados capitais?',
    options: { A: 'Inveja', B: 'Ignorância', C: 'Egoísmo', D: 'Ganância' },
    correctAnswerKey: 'A',
  },
  {
    question: 'Em que ordem seletiva se encontram os golfinhos?',
    options: { A: 'Peixes', B: 'Anfíbios', C: 'Cetáceos', D: 'Répteis' },
    correctAnswerKey: 'C',
  },
  {
    question: 'Qual o nome do pintor do quadro "Guernica"?',
    options: { A: 'Pablo Picasso', B: 'Salvador Dalí', C: 'Van Gogh', D: 'Monet' },
    correctAnswerKey: 'A',
  },
  {
    question: 'Qual o plural de "cônsul"?',
    options: { A: 'Cônsuls', B: 'Cônsules', C: 'Cônseis', D: 'Cônsul' },
    correctAnswerKey: 'B',
  },
  {
    question: 'Em que país foi construído o Muro de Berlim?',
    options: { A: 'Estados Unidos', B: 'China', C: 'Alemanha', D: 'Rússia' },
    correctAnswerKey: 'C',
  },
  {
    question: 'Em que cidade ocorreu o maior acidente nuclear da história?',
    options: { A: 'Hiroshima', B: 'Chernobyl', C: 'Fukushima', D: 'Nagasaki' },
    correctAnswerKey: 'B',
  },
  {
    question: 'Quem foi o primeiro homem a pisar na Lua?',
    options: { A: 'Yuri Gagarin', B: 'Buzz Aldrin', C: 'Michael Collins', D: 'Neil Armstrong' },
    correctAnswerKey: 'D',
  },
  {
    question: 'Qual o nome do processo de divisão celular que origina os gametas?',
    options: { A: 'Meiose', B: 'Mitose', C: 'Metáfase', D: 'Zigoto' },
    correctAnswerKey: 'A',
  },
  {
    question: 'Qual o ponto mais alto do Brasil?',
    options: { A: 'Pico da Neblina', B: 'Pico Paraná', C: 'Monte Roraima', D: 'Pico da Bandeira' },
    correctAnswerKey: 'A',
  },
  {
    question: 'Qual a primeira mulher a ganhar um Prêmio Nobel?',
    options: { A: 'Marie Curie', B: 'Madre Teresa', C: 'Valentina Tereshkova', D: 'Rosalind Franklin' },
    correctAnswerKey: 'A',
  },
];
