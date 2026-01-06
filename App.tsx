
import React, { useState, useMemo } from 'react';
import { Species, LifeStage, BreedSize, DosageResult, ProductVariety } from './types';
import { BRAVERY_DATA, TRANSITION_PLAN } from './constants';
import { 
  Calculator as CalcIcon, 
  Info, 
  Activity, 
  Calendar, 
  Target, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Leaf,
  FileDown,
  ChevronDown
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const App: React.FC = () => {
  const [species, setSpecies] = useState<Species>(Species.DOG);
  const [stage, setStage] = useState<LifeStage>(LifeStage.ADULT);
  const [size, setSize] = useState<BreedSize>(BreedSize.MEDIUM_LARGE);
  const [variety, setVariety] = useState<ProductVariety>(ProductVariety.CHICKEN);
  const [weight, setWeight] = useState<number>(10);
  const [ageMonths, setAgeMonths] = useState<number>(6);
  const [activityFactor, setActivityFactor] = useState<number>(1.4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBCS, setIsGeneratingBCS] = useState(false);

  // Filtrar variedades disponibles según especie y etapa
  const availableVarieties = useMemo(() => {
    if (species === Species.CAT) {
      if (stage === LifeStage.PUPPY_KITTEN) return [ProductVariety.CHICKEN];
      return [ProductVariety.CHICKEN, ProductVariety.SALMON];
    }
    // Perros
    if (stage === LifeStage.PUPPY_KITTEN) return [ProductVariety.CHICKEN, ProductVariety.SALMON];
    if (stage === LifeStage.LIGHT) return [ProductVariety.IBERIAN_PORK];
    if (stage === LifeStage.SENIOR) return [ProductVariety.HERRING];
    return [ProductVariety.CHICKEN, ProductVariety.SALMON, ProductVariety.LAMB, ProductVariety.IBERIAN_PORK];
  }, [species, stage]);

  // Asegurar que la variedad seleccionada sea válida si cambia el contexto
  useMemo(() => {
    if (!availableVarieties.includes(variety)) {
      setVariety(availableVarieties[0]);
    }
  }, [availableVarieties, variety]);

  const calculateDosage = (): DosageResult => {
    const rer = 70 * Math.pow(weight, 0.75);
    let f = activityFactor;
    if (stage === LifeStage.PUPPY_KITTEN) f = 3.0;
    if (stage === LifeStage.SENIOR) f = 1.2;
    if (stage === LifeStage.STERILIZED) {
        f = (species === Species.CAT) ? 1.1 : 1.4;
    }
    const der = rer * f;

    let grams = 0;
    let productName = "";
    let density = BRAVERY_DATA.KCAL.DOG_ADULT;
    let recommendedMeals = 2;
    let nutrients = ["Proteína Monoproteica", "Sin Grano", "Tapioca"];

    if (species === Species.DOG) {
      if (stage === LifeStage.PUPPY_KITTEN) {
        recommendedMeals = ageMonths <= 4 ? 4 : 3;
        productName = `Bravery ${variety} ${size === BreedSize.MINI ? 'Mini' : 'Med/Large'} Puppy`;
        nutrients.push(variety === ProductVariety.SALMON ? "Omega 3 (EPA/DHA)" : "Alta Digestibilidad");
        
        const table = size === BreedSize.MINI ? BRAVERY_DATA.DOG_PUPPY_MINI : BRAVERY_DATA.DOG_PUPPY_MED_LARGE;
        const weights = Object.keys(table).map(Number).sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
        const entry = table[weights[0] as keyof typeof table];
        const months = Object.keys(entry).map(Number).sort((a, b) => Math.abs(a - ageMonths) - Math.abs(b - ageMonths));
        grams = entry[months[0] as keyof typeof entry];
      } else if (stage === LifeStage.LIGHT) {
        productName = "Bravery Light Iberian Pork";
        density = BRAVERY_DATA.KCAL.DOG_LIGHT;
        nutrients.push("L-Carnitina", "Control de Saciedad");
        grams = der / (density / 1000);
      } else if (stage === LifeStage.SENIOR) {
        productName = "Bravery Senior Herring";
        nutrients.push("Salud Cognitiva", "Condroprotectores");
        grams = der / (density / 1000);
      } else {
        productName = `Bravery ${variety} ${size === BreedSize.MINI ? 'Mini' : 'Med/Large'} Adult`;
        const table = size === BreedSize.MINI ? BRAVERY_DATA.DOG_ADULT_MINI : BRAVERY_DATA.DOG_ADULT_MED_LARGE;
        const weights = Object.keys(table).map(Number).sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
        grams = table[weights[0] as keyof typeof table];
      }
    } else {
      if (stage === LifeStage.PUPPY_KITTEN) {
        productName = "Bravery Chicken Kitten";
        density = BRAVERY_DATA.KCAL.CAT_KITTEN;
        recommendedMeals = 4;
        const table = BRAVERY_DATA.CAT_KITTEN;
        if (ageMonths <= 2) grams = table['1-2'];
        else if (ageMonths <= 4) grams = table['2-4'];
        else if (ageMonths <= 6) grams = table['4-6'];
        else if (ageMonths <= 9) grams = table['6-9'];
        else grams = table['9-12'];
      } else if (stage === LifeStage.STERILIZED) {
        productName = `Bravery Sterilized ${variety}`;
        density = BRAVERY_DATA.KCAL.CAT_STERILIZED;
        nutrients.push("Control pH Urinario", "Bajo en Grasas");
        const table = BRAVERY_DATA.CAT_STERILIZED;
        const weights = Object.keys(table).map(Number).sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
        grams = table[weights[0] as keyof typeof table] || (der / (density / 1000));
      } else {
        productName = `Bravery Adult Cat ${variety}`;
        density = BRAVERY_DATA.KCAL.CAT_ADULT;
        const table = BRAVERY_DATA.CAT_ADULT;
        const weights = Object.keys(table).map(Number).sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
        grams = table[weights[0] as keyof typeof table];
      }
    }

    return {
      gramsPerDay: Math.round(grams),
      kcalPerDay: Math.round(der),
      rer: Math.round(rer),
      der: Math.round(der),
      productName,
      recommendedMeals,
      keyNutrients: nutrients
    };
  };

  const result = useMemo(calculateDosage, [species, stage, size, variety, weight, ageMonths, activityFactor]);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const primaryColor = [79, 70, 229];

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('BRAVERY NUTRI-DOSAGE', 20, 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('PROTOCOLO NUTRICIONAL PARA ESPECIALISTAS V3.5', 20, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 30);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. INFORMACIÓN DEL PACIENTE', 20, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const details = [
        `Especie: ${species}`,
        `Etapa Fisiológica: ${stage}`,
        `Variedad Seleccionada: ${variety}`,
        `Peso Actual/Objetivo: ${weight} kg`,
        stage === LifeStage.PUPPY_KITTEN ? `Edad: ${ageMonths} meses` : `Actividad: ${activityFactor} factor (f)`,
        species === Species.DOG ? `Tamaño Raza: ${size}` : ''
      ].filter(Boolean);

      details.forEach((text, i) => {
        doc.text(text, 25, 65 + (i * 7));
      });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. DOSIFICACIÓN RECOMENDADA', 20, 110);
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 112, 190, 112);

      doc.setFontSize(12);
      doc.text('Producto Sugerido:', 25, 122);
      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.text(result.productName.toUpperCase(), 25, 132);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Ración Diaria Total:', 25, 145);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      doc.text(`${result.gramsPerDay}g`, 25, 160);
      doc.setFontSize(12);
      doc.text('gramos por día', 65, 160);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text(`* Administrar dividiendo la ración en ${result.recommendedMeals} tomas diarias.`, 25, 170);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text('Métricas Metabólicas:', 20, 185);
      doc.setFontSize(10);
      doc.text(`Requerimiento Energético en Reposo (RER): ${result.rer} kcal`, 25, 192);
      doc.text(`Energía Diaria Requerida (DER): ${result.der} kcal`, 25, 198);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. PROTOCOLO DE TRANSICIÓN (7 DÍAS)', 20, 215);
      
      autoTable(doc, {
        startY: 220,
        head: [['Días', 'Bravery %', 'Anterior %', 'Objetivo Clínico']],
        body: TRANSITION_PLAN.map(p => [p.days, `${p.bravery}%`, `${p.old}%`, p.reason]),
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        theme: 'striped'
      });

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const disclaimer = 'Este reporte es una guía técnica basada en cálculos RER/DER estándar. El ajuste final de la ración debe realizarse según la condición corporal y evolución del paciente (ajuste de +/- 15%).';
      doc.text(doc.splitTextToSize(disclaimer, 170), 20, 280);

      doc.save(`Bravery_Protocolo_${species}_${weight}kg.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadBCS = async () => {
    setIsGeneratingBCS(true);
    try {
      const doc = new jsPDF();
      const primaryColor = [79, 70, 229];
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('GUÍA DE CONDICIÓN CORPORAL (BCS)', 20, 22);
      doc.setFontSize(10);
      doc.text('Sistema de 9 Puntos - Estándar Clínico FEDIAF', 20, 28);

      const bcsData = [
        ['1-3', 'MUY DELGADO / CAQUÉCTICO', 'Costillas, columna y pelvis prominentes. Pérdida evidente de masa muscular.'],
        ['4-5', 'CONDICIÓN IDEAL', 'Costillas palpables con mínima grasa. Cintura evidente desde arriba. Abdomen recogido.'],
        ['6', 'SOBREPESO LEVE', 'Costillas palpables con ligera capa de grasa. Cintura visible pero no marcada.'],
        ['7-8', 'OBESO', 'Costillas difíciles de palpar. Depósitos de grasa en zona lumbar y base de la cola.'],
        ['9', 'OBESIDAD MÓRBIDA', 'Depósitos masivos de grasa en tórax, columna y base de la cola. Abdomen distendido.']
      ];

      autoTable(doc, {
        startY: 45,
        head: [['Puntaje', 'Categoría Clínico', 'Descripción Visual y Palpación']],
        body: bcsData,
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 60, fontStyle: 'bold' }
        },
        theme: 'grid'
      });

      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cómo evaluar a su mascota:', 20, doc.lastAutoTable.finalY + 20);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const steps = [
        '1. Palpación de costillas: Use sus manos para sentir las costillas.',
        '2. Vista superior: Observe a su mascota desde arriba; cintura visible.',
        '3. Vista lateral: Observe el perfil abdominal elevado.',
        '4. Base de la cola: Pequeña cantidad de grasa sin bultos.'
      ];
      steps.forEach((step, i) => {
        doc.text(step, 20, doc.lastAutoTable.finalY + 30 + (i * 8));
      });

      doc.save('Bravery_Guia_BCS_Clinico.pdf');
    } catch (error) {
      console.error('Error generating BCS PDF:', error);
    } finally {
      setIsGeneratingBCS(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Bravery <span className="text-indigo-600">NutriDosage</span></h1>
              <p className="text-xs text-slate-500 font-medium">Análisis Técnico y Protocolos</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
            <a href="#calculator" className="hover:text-indigo-600 transition-colors py-2 border-b-2 border-transparent hover:border-indigo-600">Calculadora</a>
            <a href="#tech" className="hover:text-indigo-600 transition-colors py-2 border-b-2 border-transparent hover:border-indigo-600">Ficha Técnica</a>
            <a href="#transition" className="hover:text-indigo-600 transition-colors py-2 border-b-2 border-transparent hover:border-indigo-600">Transición</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 space-y-12">
        <section className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Optimización Metabólica Super Premium</h2>
            <p className="text-indigo-100 text-lg opacity-90 leading-relaxed mb-6">
              Dosificación estratificada basada en el Requerimiento Energético en Reposo (RER) e ingredientes monoproteicos.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
                <Leaf size={16} /> GMO Free
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
                <Zap size={16} /> Grain Free
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
                <ShieldCheck size={16} /> Monoproteic
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 pointer-events-none text-white">
             <ShieldCheck size={400} className="transform translate-x-1/4 -translate-y-1/4" />
          </div>
        </section>

        <div id="calculator" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24">
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <CalcIcon className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Parámetros del Paciente</h3>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSpecies(Species.DOG)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${species === Species.DOG ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl font-bold">🐶</span>
                    <span className="font-bold text-sm">Canino</span>
                  </button>
                  <button 
                    onClick={() => setSpecies(Species.CAT)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${species === Species.CAT ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl font-bold">🐱</span>
                    <span className="font-bold text-sm">Felino</span>
                  </button>
                </div>

                {/* Variedad de Alimento (Proteína) */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Variedad del Alimento (Proteína Principal)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableVarieties.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVariety(v)}
                        className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${variety === v ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'}`}
                      >
                        {v === ProductVariety.CHICKEN && "🍗"}
                        {v === ProductVariety.SALMON && "🐟"}
                        {v === ProductVariety.LAMB && "🥩"}
                        {v === ProductVariety.IBERIAN_PORK && "🐖"}
                        {v === ProductVariety.HERRING && "🐟"}
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Target size={14} /> {stage === LifeStage.PUPPY_KITTEN && species === Species.DOG ? "Peso Adulto Estimado" : "Peso Actual (kg)"}
                    </label>
                    <div className="relative">
                      <input 
                        type="range" min="0.5" max="70" step="0.5"
                        value={weight} onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between mt-2 text-xl font-bold text-slate-800">
                        <span>{weight} kg</span>
                        <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm font-bold">Peso Meta</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Etapa Fisiológica</label>
                    <select 
                      value={stage}
                      onChange={(e) => setStage(e.target.value as LifeStage)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    >
                      <option value={LifeStage.PUPPY_KITTEN}>{species === Species.DOG ? "Cachorro" : "Gatito"}</option>
                      <option value={LifeStage.ADULT}>Adulto Mantenimiento</option>
                      {species === Species.CAT && <option value={LifeStage.STERILIZED}>Esterilizado</option>}
                      {species === Species.DOG && <option value={LifeStage.LIGHT}>Control de Peso (Light)</option>}
                      {species === Species.DOG && <option value={LifeStage.SENIOR}>Senior (+7 años)</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stage === LifeStage.PUPPY_KITTEN && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} /> Edad del paciente (meses)
                      </label>
                      <select 
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none text-slate-700"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m} meses</option>)}
                      </select>
                    </div>
                  )}

                  {species === Species.DOG && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tamaño de Raza</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSize(BreedSize.MINI)}
                          className={`flex-1 p-3 rounded-lg border font-bold text-sm transition-all ${size === BreedSize.MINI ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          Mini (&lt;10kg)
                        </button>
                        <button 
                          onClick={() => setSize(BreedSize.MEDIUM_LARGE)}
                          className={`flex-1 p-3 rounded-lg border font-bold text-sm transition-all ${size === BreedSize.MEDIUM_LARGE ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          Med/Large (&gt;10kg)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Activity size={14} /> Nivel de Actividad
                    </label>
                    <select 
                      value={activityFactor}
                      onChange={(e) => setActivityFactor(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none text-slate-700"
                    >
                      <option value={1.2}>Baja (Sedentario)</option>
                      <option value={1.4}>Moderada (Paseos)</option>
                      <option value={1.6}>Activa (Deporte)</option>
                      <option value={2.5}>Extrema (Trabajo)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div id="transition" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 scroll-mt-24">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                <ArrowRight className="text-indigo-600" size={20} />
                Protocolo de Transición (7 Días)
              </h3>
              <div className="space-y-3">
                {TRANSITION_PLAN.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-16 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Días</span>
                      <span className="font-bold text-indigo-600 text-lg">{step.days}</span>
                    </div>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                       <div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: `${step.bravery}%` }}></div>
                    </div>
                    <div className="flex-1 text-sm font-bold text-slate-700 leading-tight text-right">
                      {step.bravery}% Bravery
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-indigo-600 rounded-2xl shadow-2xl p-8 text-white sticky top-24">
              <div className="space-y-8">
                <div>
                  <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Producto Recomendado</h4>
                  <p className="text-2xl font-black leading-tight">{result.productName}</p>
                </div>

                <div className="flex flex-col items-center justify-center py-8 bg-white/10 rounded-3xl border border-white/20 shadow-inner">
                   <p className="text-indigo-200 text-xs font-bold uppercase mb-2">Ración Diaria</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-7xl font-black tracking-tighter">{result.gramsPerDay}</span>
                      <span className="text-2xl font-bold opacity-80">g</span>
                   </div>
                   <div className="mt-4 flex items-center gap-2 bg-indigo-500/50 px-4 py-2 rounded-full border border-indigo-400/30">
                      <Zap size={14} className="text-yellow-300" />
                      <p className="text-xs font-bold uppercase tracking-wide">Dividir en {result.recommendedMeals} tomas</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold opacity-60 uppercase mb-1">Metabolismo</p>
                    <p className="text-xl font-black">{result.rer} <span className="text-[10px] font-bold text-white/60">kcal</span></p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold opacity-60 uppercase mb-1">Gasto Total</p>
                    <p className="text-xl font-black">{result.der} <span className="text-[10px] font-bold text-white/60">kcal</span></p>
                  </div>
                </div>

                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="w-full bg-white text-indigo-700 font-bold py-4 rounded-xl shadow-xl hover:bg-indigo-50 hover:-translate-y-1 transition-all active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700"></div>
                  ) : (
                    <FileDown size={18} />
                  )}
                  {isGenerating ? 'Generando...' : 'Descargar Protocolo Técnico'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <section id="tech" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-24">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Análisis Bioquímico</h3>
             <p className="text-slate-500 mt-2 font-medium">Arquitectura nutricional basada en ingredientes de alta biodisponibilidad.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 space-y-4">
               <div className="bg-orange-100 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                  <Zap size={28} />
               </div>
               <h4 className="font-black text-slate-800 text-lg">Monoproteico</h4>
               <p className="text-sm text-slate-500 font-medium">Reduce drásticamente el riesgo de alergias al usar una sola fuente de proteína animal.</p>
            </div>
            <div className="p-8 space-y-4">
               <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                  <Leaf size={28} />
               </div>
               <h4 className="font-black text-slate-800 text-lg">Tapioca</h4>
               <p className="text-sm text-slate-500 font-medium">Fuente de carbohidratos sin granos que previene picos de insulina postprandial.</p>
            </div>
            <div className="p-8 space-y-4">
               <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <ShieldCheck size={28} />
               </div>
               <h4 className="font-black text-slate-800 text-lg">Minerales Quelados</h4>
               <p className="text-sm text-slate-500 font-medium">Máxima absorción mineral para soporte articular y muscular superior.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Fórmula RER de Precisión</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
                  Cálculo basado en el exponente metabólico 0.75 para máxima exactitud académica.
                </p>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl font-mono text-xl text-indigo-300 border border-white/10 inline-block">
                  RER = 70 × (Peso)^0.75
                </div>
              </div>
              <Activity className="absolute bottom-0 right-0 text-white/5 -mb-12 -mr-12" size={300} />
           </div>
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
              <h3 className="text-2xl font-black mb-4 text-slate-800 uppercase tracking-tighter">Reporte Clínico</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed relative z-10">
                La dosificación sugerida debe ajustarse según la condición corporal individual (BCS).
              </p>
              <div className="mt-8 flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                  {isGeneratingBCS ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    "?"
                  )}
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soporte Técnico</p>
                   <button 
                    onClick={handleDownloadBCS}
                    disabled={isGeneratingBCS}
                    className="text-sm font-bold text-indigo-600 cursor-pointer hover:underline text-left block"
                   >
                    {isGeneratingBCS ? 'Generando Guía...' : 'Descargar Guía de Condición Corporal (BCS)'}
                   </button>
                </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-16 px-8 text-center">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2024 Bravery Super Premium Pet Food • Professional Veterinary Tools v3.5</p>
      </footer>
    </div>
  );
};

export default App;
