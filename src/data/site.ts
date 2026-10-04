/*
  Contenido de las secciones (excepto proyectos, que viven en src/content/proyectos).
  BORRADOR: todo este texto está pendiente de aprobación del autor.
  Cambia solo los textos; la estructura la leen los componentes.
*/
import type { Lang } from '../i18n/ui';

type T = Record<Lang, string>;

export const contact = {
  email: 'marianorov08@outlook.com',
  linkedin: 'https://www.linkedin.com/in/marianovillagomez',
  linkedinLabel: 'linkedin.com/in/marianovillagomez',
};

export const about: { body: T; more: T[] } = {
  body: {
    es: 'Estudio mecatrónica (séptimo semestre) en Monterrey. Me interesa el punto donde se cruzan las máquinas, las redes y el software: ciberseguridad, sistemas OT, inteligencia artificial y modelos de lenguaje. Aquí documento lo que construyo mientras aprendo.',
    en: 'I study mechatronics (seventh semester) in Monterrey. I care about the point where machines, networks and software meet: cybersecurity, OT systems, artificial intelligence and language models. This is where I document what I build while I learn.',
  },
  more: [
    {
      es: 'Sigo una ruta de estudio propia, una hora al día, que va de los fundamentos (programación, Linux, redes) a temas especializados.',
      en: 'I follow my own study path, one hour a day, from the fundamentals (programming, Linux, networking) to specialized topics.',
    },
    {
      es: 'Cada proyecto termina con un repositorio documentado: qué hace, cómo funciona, qué resultados dio y cuáles son sus límites.',
      en: 'Every project ends with a documented repository: what it does, how it works, what it found and where its limits are.',
    },
    {
      es: 'Trabajo en Linux (Fedora) y aprendo Git sobre la marcha, en proyectos reales.',
      en: 'I work on Linux (Fedora) and learn Git as I go, on real projects.',
    },
  ],
};

/** Fotos tipo pasaporte. Pon los archivos en public/fotos/ y escribe la ruta en src. */
export const photos: { src: string | null; alt: T }[] = [
  { src: null, alt: { es: 'Foto de Mariano, versión 1', en: 'Photo of Mariano, version 1' } },
  { src: null, alt: { es: 'Foto de Mariano, versión 2', en: 'Photo of Mariano, version 2' } },
  { src: null, alt: { es: 'Foto de Mariano, versión 3', en: 'Photo of Mariano, version 3' } },
  { src: null, alt: { es: 'Foto de Mariano, versión 4', en: 'Photo of Mariano, version 4' } },
];

export type Status = 'done' | 'progress' | 'next' | 'later';

export const route: { status: Status; title: T; items: T[] }[] = [
  {
    status: 'progress',
    title: { es: 'F0 · Fundamentos', en: 'F0 · Fundamentals' },
    items: [
      { es: 'Python con CS50x', en: 'Python with CS50x' },
      { es: 'Linux y terminal: OverTheWire Bandit', en: 'Linux and the terminal: OverTheWire Bandit' },
      { es: 'Redes con los cursos de Cisco y Google', en: 'Networking with the Cisco and Google courses' },
      { es: 'Git y GitHub en proyectos reales', en: 'Git and GitHub on real projects' },
      { es: 'Proyecto: P01, analizador de logs SSH', en: 'Project: P01, SSH log analyzer' },
    ],
  },
  {
    status: 'next',
    title: { es: 'CompTIA Security+', en: 'CompTIA Security+' },
    items: [
      { es: 'Siguiente certificación después del certificado de Google', en: 'Next certification after the Google certificate' },
    ],
  },
  {
    status: 'later',
    title: { es: 'Seguridad en la nube o ML/LLMs', en: 'Cloud security or ML/LLMs' },
    items: [
      { es: 'Especialización por decidir, conectada con OT e IA', en: 'Specialization to be decided, connected to OT and AI' },
    ],
  },
];

export const certs: { status: Status; name: string; issuer: string; year?: string; detail: T; url?: string }[] = [
  {
    status: 'done',
    name: 'Google Cybersecurity Certificate',
    issuer: 'Google · Coursera',
    year: '2026',
    detail: {
      es: 'Programa profesional de ciberseguridad de Google. Insignia de Credly pendiente de publicar.',
      en: "Google's professional cybersecurity program. Credly badge to be published.",
    },
  },
  {
    status: 'done',
    name: 'Networking Essentials',
    issuer: 'Cisco Networking Academy',
    detail: { es: 'Fundamentos de redes.', en: 'Networking fundamentals.' },
  },
  {
    status: 'done',
    name: 'Cybersecurity Essentials',
    issuer: 'Cisco Networking Academy',
    detail: { es: 'Fundamentos de ciberseguridad.', en: 'Cybersecurity fundamentals.' },
  },
  {
    status: 'progress',
    name: 'CyberOps Associate',
    issuer: 'Cisco Networking Academy',
    detail: { es: 'Curso en curso: operaciones de seguridad.', en: 'Course in progress: security operations.' },
  },
  {
    status: 'progress',
    name: 'CS50x',
    issuer: 'Harvard · edX',
    detail: { es: 'Curso en curso: fundamentos de ciencias de la computación.', en: 'Course in progress: computer science fundamentals.' },
  },
];

export const skills: { area: T; items: T[] }[] = [
  {
    area: { es: 'Ciberseguridad', en: 'Cybersecurity' },
    items: [
      { es: 'Análisis de logs de autenticación', en: 'Authentication log analysis' },
      { es: 'Detección de fuerza bruta', en: 'Brute-force detection' },
      { es: 'Fundamentos de seguridad (Google, Cisco)', en: 'Security fundamentals (Google, Cisco)' },
    ],
  },
  {
    area: { es: 'OT · Automatización', en: 'OT · Automation' },
    items: [
      { es: 'FactoryTalk Optix: HMI e IIoT (reto de Rockwell Automation)', en: 'FactoryTalk Optix: HMI and IIoT (Rockwell Automation challenge)' },
    ],
  },
  {
    area: { es: 'Programación', en: 'Programming' },
    items: [
      { es: 'Python (csv, argparse)', en: 'Python (csv, argparse)' },
      { es: 'Git y GitHub', en: 'Git and GitHub' },
      { es: 'Linux y Bash (grep, tuberías)', en: 'Linux and Bash (grep, pipes)' },
    ],
  },
  {
    area: { es: 'Redes', en: 'Networking' },
    items: [{ es: 'Fundamentos de redes TCP/IP', en: 'TCP/IP networking fundamentals' }],
  },
  {
    area: { es: 'IA · ML · LLMs', en: 'AI · ML · LLMs' },
    items: [{ es: 'En la ruta de aprendizaje', en: 'On the learning path' }],
  },
];
