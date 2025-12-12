/**
 * SVG strings para las partes del cuerpo
 * Estilo: Cuerpo completo en gris, parte específica resaltada en rojo/naranja
 */

export const bodyPartSvgs: Record<string, string> = {
  pecho: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Hombros (gris) -->
  <path d="M 35 26 Q 30 30 28 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 26 Q 70 30 72 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- PECTORALES RESALTADOS EN ROJO -->
  <path d="M 40 25 Q 35 30 38 40 Q 40 50 45 55 Q 50 58 55 55 Q 60 50 62 40 Q 65 30 60 25" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  <path d="M 42 32 Q 40 38 42 45" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 58 32 Q 60 38 58 45" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- Torso (gris) -->
  <path d="M 42 50 Q 40 60 42 70 Q 45 75 50 77 Q 55 75 58 70 Q 60 60 58 50" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Abdomen (gris) -->
  <path d="M 44 60 L 56 60" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <path d="M 44 65 L 56 65" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 70 Q 36 75 38 80" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 70 Q 64 75 62 80" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 80 Q 38 90 40 105 Q 42 110 45 112" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 80 Q 62 90 60 105 Q 58 110 55 112" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Rodillas (gris) -->
  <circle cx="42" cy="95" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <circle cx="58" cy="95" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Pies (gris) -->
  <path d="M 38 110 Q 36 112 38 114" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 110 Q 64 112 62 114" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`,

  espalda: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- ESPALDA RESALTADA - Trapecio superior -->
  <path d="M 40 22 Q 35 28 40 35 Q 45 40 50 42 Q 55 40 60 35 Q 65 28 60 22" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- ESPALDA RESALTADA - Deltoides posteriores -->
  <path d="M 32 30 Q 28 35 32 42" stroke="#c0392b" stroke-width="2.5" fill="none"/>
  <path d="M 68 30 Q 72 35 68 42" stroke="#c0392b" stroke-width="2.5" fill="none"/>
  
  <!-- ESPALDA RESALTADA - Dorsales (latissimus dorsi) -->
  <path d="M 38 40 Q 32 50 38 70 Q 42 80 50 82 Q 58 80 62 70 Q 68 50 62 40" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- ESPALDA RESALTADA - Columna vertebral -->
  <path d="M 50 40 L 50 100" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
  
  <!-- ESPALDA RESALTADA - Músculos paraespinales -->
  <path d="M 45 50 Q 43 55 45 60" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 55 50 Q 57 55 55 60" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 45 65 Q 43 70 45 75" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 55 65 Q 57 70 55 75" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- ESPALDA RESALTADA - Líneas de definición -->
  <path d="M 42 75 Q 40 80 42 85" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 58 75 Q 60 80 58 85" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 70 Q 36 75 38 80" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 70 Q 64 75 62 80" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 80 Q 38 90 40 105 Q 42 110 45 112" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 80 Q 62 90 60 105 Q 58 110 55 112" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Rodillas (gris) -->
  <circle cx="42" cy="95" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <circle cx="58" cy="95" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Pies (gris) -->
  <path d="M 38 110 Q 36 112 38 114" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 110 Q 64 112 62 114" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`,

  hombros: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- HOMBROS RESALTADOS - Deltoides anterior izquierdo -->
  <path d="M 25 28 Q 20 33 25 43 Q 30 48 35 50" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- HOMBROS RESALTADOS - Deltoides anterior derecho -->
  <path d="M 75 28 Q 80 33 75 43 Q 70 48 65 50" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- HOMBROS RESALTADOS - Hueso de la clavícula -->
  <path d="M 30 32 Q 28 35 30 40" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 70 32 Q 72 35 70 40" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- HOMBROS RESALTADOS - Deltoides medio -->
  <path d="M 28 38 Q 25 43 28 48" stroke="#c0392b" stroke-width="2.5" fill="none"/>
  <path d="M 72 38 Q 75 43 72 48" stroke="#c0392b" stroke-width="2.5" fill="none"/>
  
  <!-- HOMBROS RESALTADOS - Líneas de definición deltoides -->
  <path d="M 30 46 Q 28 50 30 54" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 70 46 Q 72 50 70 54" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- Pecho (gris) -->
  <path d="M 40 40 Q 35 45 40 55 Q 45 60 50 62 Q 55 60 60 55 Q 65 45 60 40" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Torso (gris) -->
  <path d="M 42 55 Q 40 65 42 75 Q 45 80 50 82 Q 55 80 58 75 Q 60 65 58 55" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 50 Q 30 60 35 70" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 50 Q 70 60 65 70" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 75 Q 36 80 38 85" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 75 Q 64 80 62 85" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 85 Q 38 95 40 110 Q 42 115 45 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 85 Q 62 95 60 110 Q 58 115 55 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Rodillas (gris) -->
  <circle cx="42" cy="100" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <circle cx="58" cy="100" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Pies (gris) -->
  <path d="M 38 115 Q 36 117 38 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 115 Q 64 117 62 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`,

  brazos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Hombros (gris) -->
  <path d="M 35 26 Q 30 30 28 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 26 Q 70 30 72 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- BRAZOS RESALTADOS - Hombro izquierdo -->
  <circle cx="25" cy="28" r="5" fill="#e74c3c" fill-opacity="0.7" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Deltoides anterior izquierdo -->
  <path d="M 20 30 Q 18 35 20 40 Q 22 45 25 47" 
        fill="#e74c3c" fill-opacity="0.8" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Bíceps braquial izquierdo -->
  <path d="M 22 40 Q 18 50 22 65 Q 26 75 30 78 Q 34 80 38 78 Q 42 75 46 65 Q 50 50 46 40" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- BRAZOS RESALTADOS - Separación entre cabeza larga y corta del bíceps -->
  <path d="M 30 48 Q 28 52 30 56" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 34 52 Q 32 56 34 60" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  
  <!-- BRAZOS RESALTADOS - Tríceps izquierdo -->
  <path d="M 28 45 Q 25 50 28 60 Q 30 65 32 68" 
        fill="#e74c3c" fill-opacity="0.7" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Antebrazo izquierdo -->
  <path d="M 26 65 Q 24 75 26 85 Q 28 90 30 92" 
        fill="#e74c3c" fill-opacity="0.8" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Hombro derecho -->
  <circle cx="75" cy="28" r="5" fill="#e74c3c" fill-opacity="0.7" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Deltoides anterior derecho -->
  <path d="M 80 30 Q 82 35 80 40 Q 78 45 75 47" 
        fill="#e74c3c" fill-opacity="0.8" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Bíceps braquial derecho -->
  <path d="M 78 40 Q 82 50 78 65 Q 74 75 70 78 Q 66 80 62 78 Q 58 75 54 65 Q 50 50 54 40" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- BRAZOS RESALTADOS - Separación entre cabeza larga y corta del bíceps -->
  <path d="M 70 48 Q 72 52 70 56" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 66 52 Q 68 56 66 60" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  
  <!-- BRAZOS RESALTADOS - Tríceps derecho -->
  <path d="M 72 45 Q 75 50 72 60 Q 70 65 68 68" 
        fill="#e74c3c" fill-opacity="0.7" stroke="#c0392b" stroke-width="2"/>
  
  <!-- BRAZOS RESALTADOS - Antebrazo derecho -->
  <path d="M 74 65 Q 76 75 74 85 Q 72 90 70 92" 
        fill="#e74c3c" fill-opacity="0.8" stroke="#c0392b" stroke-width="2"/>
  
  <!-- Pecho (gris) -->
  <path d="M 40 40 Q 35 45 40 55 Q 45 60 50 62 Q 55 60 60 55 Q 65 45 60 40" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Torso (gris) -->
  <path d="M 42 55 Q 40 65 42 75 Q 45 80 50 82 Q 55 80 58 75 Q 60 65 58 55" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 75 Q 36 80 38 85" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 75 Q 64 80 62 85" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 85 Q 38 95 40 110 Q 42 115 45 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 85 Q 62 95 60 110 Q 58 115 55 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Rodillas (gris) -->
  <circle cx="42" cy="100" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <circle cx="58" cy="100" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Pies (gris) -->
  <path d="M 38 115 Q 36 117 38 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 115 Q 64 117 62 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`,

  piernas: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Hombros (gris) -->
  <path d="M 35 26 Q 30 30 28 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 26 Q 70 30 72 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Pecho (gris) -->
  <path d="M 40 40 Q 35 45 40 55 Q 45 60 50 62 Q 55 60 60 55 Q 65 45 60 40" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Torso (gris) -->
  <path d="M 42 55 Q 40 65 42 75 Q 45 80 50 82 Q 55 80 58 75 Q 60 65 58 55" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 70 Q 36 75 38 80" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 70 Q 64 75 62 80" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- PIERNAS RESALTADAS - Cuádriceps izquierdo -->
  <path d="M 30 75 Q 25 85 30 105 Q 35 115 38 117 Q 40 119 42 117 Q 44 115 46 105 Q 50 85 45 75" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- PIERNAS RESALTADAS - Cuádriceps derecho -->
  <path d="M 70 75 Q 75 85 70 105 Q 65 115 62 117 Q 60 119 58 117 Q 56 115 54 105 Q 50 85 55 75" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- PIERNAS RESALTADAS - Vasto lateral -->
  <path d="M 25 85 Q 22 95 25 105" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 75 85 Q 78 95 75 105" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- PIERNAS RESALTADAS - Recto femoral -->
  <path d="M 32 90 Q 30 100 32 110" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 68 90 Q 70 100 68 110" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- PIERNAS RESALTADAS - Pantorrillas -->
  <path d="M 30 110 Q 28 115 30 118" 
        fill="#e74c3c" fill-opacity="0.8" stroke="#c0392b" stroke-width="2"/>
  <path d="M 70 110 Q 72 115 70 118" 
        fill="#e74c3c" fill-opacity="0.8" stroke="#c0392b" stroke-width="2"/>
  
  <!-- PIERNAS RESALTADAS - Rodillas -->
  <circle cx="35" cy="100" r="3" fill="#c0392b" fill-opacity="0.4" stroke="#c0392b" stroke-width="1.5"/>
  <circle cx="65" cy="100" r="3" fill="#c0392b" fill-opacity="0.4" stroke="#c0392b" stroke-width="1.5"/>
</svg>`,

  gluteos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Hombros (gris) -->
  <path d="M 35 26 Q 30 30 28 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 26 Q 70 30 72 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Pecho (gris) -->
  <path d="M 40 40 Q 35 45 40 55 Q 45 60 50 62 Q 55 60 60 55 Q 65 45 60 40" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Torso (gris) -->
  <path d="M 42 55 Q 40 65 42 75 Q 45 80 50 82 Q 55 80 58 75 Q 60 65 58 55" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- GLÚTEOS RESALTADOS - Glúteo izquierdo -->
  <path d="M 25 65 Q 20 75 25 95 Q 30 105 35 107 Q 40 109 42 107 Q 44 105 46 95 Q 50 75 45 65" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- GLÚTEOS RESALTADOS - Glúteo derecho -->
  <path d="M 50 65 Q 55 75 50 95 Q 45 105 40 107 Q 35 109 33 107 Q 31 105 29 95 Q 25 75 30 65" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- GLÚTEOS RESALTADOS - Línea de separación -->
  <path d="M 50 70 L 50 110" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
  
  <!-- GLÚTEOS RESALTADOS - Glúteo mayor -->
  <path d="M 30 80 Q 28 90 30 100" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 70 80 Q 72 90 70 100" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- GLÚTEOS RESALTADOS - Líneas de definición -->
  <path d="M 32 90 Q 30 95 32 100" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 68 90 Q 70 95 68 100" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 35 95 Q 33 100 35 105" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 65 95 Q 67 100 65 105" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 100 Q 38 110 40 115" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 100 Q 62 110 60 115" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
</svg>`,

  abdomen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Hombros (gris) -->
  <path d="M 35 26 Q 30 30 28 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 26 Q 70 30 72 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Pecho (gris) -->
  <path d="M 40 40 Q 35 45 40 55 Q 45 60 50 62 Q 55 60 60 55 Q 65 45 60 40" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- ABDOMEN RESALTADO - Recto abdominal superior -->
  <path d="M 40 50 Q 35 55 40 70 Q 45 75 50 77 Q 55 75 60 70 Q 65 55 60 50" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- ABDOMEN RESALTADO - Líneas abdominales (six-pack) -->
  <path d="M 42 58 L 58 58" stroke="#1a252f" stroke-width="2.5"/>
  <path d="M 42 63 L 58 63" stroke="#1a252f" stroke-width="2.5"/>
  <path d="M 42 68 L 58 68" stroke="#1a252f" stroke-width="2.5"/>
  
  <!-- ABDOMEN RESALTADO - Recto abdominal medio -->
  <path d="M 42 72 Q 38 77 42 87 Q 45 92 50 94 Q 55 92 58 87 Q 62 77 58 72" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  <path d="M 42 77 L 58 77" stroke="#1a252f" stroke-width="2.5"/>
  <path d="M 42 82 L 58 82" stroke="#1a252f" stroke-width="2.5"/>
  
  <!-- ABDOMEN RESALTADO - Oblicuos -->
  <path d="M 32 60 Q 30 65 32 70" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 68 60 Q 70 65 68 70" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 32 75 Q 30 80 32 85" stroke="#c0392b" stroke-width="2" fill="none"/>
  <path d="M 68 75 Q 70 80 68 85" stroke="#c0392b" stroke-width="2" fill="none"/>
  
  <!-- ABDOMEN RESALTADO - Línea alba (centro) -->
  <path d="M 50 50 L 50 90" stroke="#1a252f" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 88 Q 36 93 38 98" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 88 Q 64 93 62 98" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 95 Q 38 105 40 110 Q 42 115 45 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 95 Q 62 105 60 110 Q 58 115 55 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Rodillas (gris) -->
  <circle cx="42" cy="105" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <circle cx="58" cy="105" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Pies (gris) -->
  <path d="M 38 115 Q 36 117 38 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 115 Q 64 117 62 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`,

  cardio: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza (gris) -->
  <circle cx="50" cy="10" r="8" fill="#95a5a6" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 50 18 L 50 24" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  
  <!-- Hombros (gris) -->
  <path d="M 35 26 Q 30 30 28 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 26 Q 70 30 72 35" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Pecho (gris) -->
  <path d="M 40 40 Q 35 45 40 55 Q 45 60 50 62 Q 55 60 60 55 Q 65 45 60 40" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Torso (gris) -->
  <path d="M 42 55 Q 40 65 42 75 Q 45 80 50 82 Q 55 80 58 75 Q 60 65 58 55" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- CORAZÓN RESALTADO -->
  <path d="M 50 50 L 45 45 C 35 35 25 45 25 55 C 25 65 30 70 35 70 C 40 70 45 65 50 60 C 55 65 60 70 65 70 C 70 70 75 65 75 55 C 75 45 65 35 55 45 Z" 
        fill="#e74c3c" fill-opacity="0.9" stroke="#c0392b" stroke-width="2.5"/>
  
  <!-- CORAZÓN RESALTADO - Ventrículos -->
  <path d="M 42 55 Q 40 60 42 65" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 58 55 Q 60 60 58 65" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  
  <!-- CORAZÓN RESALTADO - Aurículas -->
  <path d="M 38 50 Q 35 55 38 60" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  <path d="M 62 50 Q 65 55 62 60" stroke="#c0392b" stroke-width="1.5" fill="none"/>
  
  <!-- Brazos (gris) -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#7f8c8d" stroke-width="1.5" fill="none" opacity="0.5"/>
  
  <!-- Cadera (gris) -->
  <path d="M 38 75 Q 36 80 38 85" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 75 Q 64 80 62 85" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  
  <!-- Piernas (gris) -->
  <path d="M 40 85 Q 38 95 40 110 Q 42 115 45 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  <path d="M 60 85 Q 62 95 60 110 Q 58 115 55 117" 
        fill="#95a5a6" fill-opacity="0.15" stroke="#7f8c8d" stroke-width="1" opacity="0.5"/>
  
  <!-- Rodillas (gris) -->
  <circle cx="42" cy="100" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  <circle cx="58" cy="100" r="2" fill="#7f8c8d" fill-opacity="0.2" stroke="#7f8c8d" stroke-width="0.8" opacity="0.5"/>
  
  <!-- Pies (gris) -->
  <path d="M 38 115 Q 36 117 38 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M 62 115 Q 64 117 62 119" stroke="#7f8c8d" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`,

  fullbody: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <!-- Cabeza -->
  <circle cx="50" cy="10" r="8" fill="#2c3e50" fill-opacity="0.3" stroke="#1a252f" stroke-width="1"/>
  
  <!-- Cuello -->
  <path d="M 50 18 L 50 24" stroke="#1a252f" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Hombros y pecho -->
  <path d="M 40 26 Q 35 30 40 40 Q 45 45 50 47 Q 55 45 60 40 Q 65 30 60 26" 
        fill="#e74c3c" fill-opacity="0.6" stroke="#c0392b" stroke-width="2"/>
  
  <!-- Brazos -->
  <path d="M 35 30 Q 30 40 35 50" stroke="#1a252f" stroke-width="2" fill="none"/>
  <path d="M 65 30 Q 70 40 65 50" stroke="#1a252f" stroke-width="2" fill="none"/>
  
  <!-- Torso -->
  <path d="M 42 40 Q 40 50 42 60 Q 45 65 50 67 Q 55 65 58 60 Q 60 50 58 40" 
        fill="#e74c3c" fill-opacity="0.5" stroke="#c0392b" stroke-width="1.5"/>
  
  <!-- Abdomen -->
  <path d="M 44 55 L 56 55" stroke="#1a252f" stroke-width="1.5"/>
  <path d="M 44 60 L 56 60" stroke="#1a252f" stroke-width="1.5"/>
  
  <!-- Cadera -->
  <path d="M 38 65 Q 36 70 38 75" stroke="#1a252f" stroke-width="1.5" fill="none"/>
  <path d="M 62 65 Q 64 70 62 75" stroke="#1a252f" stroke-width="1.5" fill="none"/>
  
  <!-- Piernas -->
  <path d="M 40 75 Q 38 85 40 100 Q 42 105 45 107" 
        fill="#16a085" fill-opacity="0.6" stroke="#138d75" stroke-width="1.5"/>
  <path d="M 60 75 Q 62 85 60 100 Q 58 105 55 107" 
        fill="#16a085" fill-opacity="0.6" stroke="#138d75" stroke-width="1.5"/>
  
  <!-- Rodillas -->
  <circle cx="42" cy="90" r="2" fill="#1a252f" fill-opacity="0.3" stroke="#1a252f" stroke-width="1"/>
  <circle cx="58" cy="90" r="2" fill="#1a252f" fill-opacity="0.3" stroke="#1a252f" stroke-width="1"/>
  
  <!-- Pantorrillas -->
  <path d="M 40 100 Q 38 105 40 110" stroke="#138d75" stroke-width="1.5" fill="none"/>
  <path d="M 60 100 Q 62 105 60 110" stroke="#138d75" stroke-width="1.5" fill="none"/>
  
  <!-- Pies -->
  <path d="M 38 110 Q 36 112 38 114" stroke="#1a252f" stroke-width="1.5" fill="none"/>
  <path d="M 62 110 Q 64 112 62 114" stroke="#1a252f" stroke-width="1.5" fill="none"/>
</svg>`,
};
