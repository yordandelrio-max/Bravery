
import React, { useState, useMemo } from 'react';
import { Species, LifeStage, DosageResult, ProductVariety } from './types';
import { BRAVERY_DATA } from './constants';
import { 
  Calculator as CalcIcon, 
  Calendar, 
  Target, 
  ShieldCheck,
  Zap,
  Leaf,
  FileDown,
  Info,
  ChevronRight
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const App: React.FC = () => {
  const [species, setSpecies] = useState<Species>(Species.DOG);
  const [stage, setStage] = useState<LifeStage>(LifeStage.ADULT);
  const [variety, setVariety] = useState<ProductVariety>(ProductVariety.CHICKEN);
  const [weight, setWeight] = useState<number>(species === Species.DOG ? 10 : 4);
  const [ageMonths, setAgeMonths] = useState<number>(6);
  const [activityFactor, setActivityFactor] = useState<number>(1.4);
  const [isGenerating, setIsGenerating] = useState(false);

  const interpolate = (x: number, x0: number, y0: number, x1: number, y1: number) => {
    if (x0 === x1) return y0;
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
  };

  const getInterpolatedRation = (currentWeight: number, dataTable: Record<number, any>): number => {
    const sortedWeights = Object.keys(dataTable).map(Number).sort((a, b) => a - b);
    if (currentWeight <= sortedWeights[0]) return dataTable[sortedWeights[0]];
    if (currentWeight >= sortedWeights[sortedWeights.length - 1]) {
      const maxW = sortedWeights[sortedWeights.length - 1];
      const secondMaxW = sortedWeights[sortedWeights.length - 2];
      return interpolate(currentWeight, secondMaxW, dataTable[secondMaxW], maxW, dataTable[maxW]);
    }
    for (let i = 0; i < sortedWeights.length - 1; i++) {
      const w0 = sortedWeights[i];
      const w1 = sortedWeights[i + 1];
      if (currentWeight >= w0 && currentWeight <= w1) {
        return interpolate(currentWeight, w0, dataTable[w0], w1, dataTable[w1]);
      }
    }
    return dataTable[sortedWeights[0]];
  };

  const availableVarieties = useMemo(() => {
    if (species === Species.CAT) {
      if (stage === LifeStage.PUPPY_KITTEN) return [ProductVariety.CHICKEN];
      if (stage === LifeStage.SENIOR) return [ProductVariety.HERRING];
      return [ProductVariety.CHICKEN, ProductVariety.SALMON];
    }
    if (stage === LifeStage.PUPPY_KITTEN) return [ProductVariety.CHICKEN, ProductVariety.SALMON];
    if (stage === LifeStage.LIGHT || stage === LifeStage.LIGHT_MINI) return [ProductVariety.IBERIAN_PORK];
    if (stage === LifeStage.SENIOR || stage === LifeStage.SENIOR_MINI) return [ProductVariety.HERRING];
    return [ProductVariety.CHICKEN, ProductVariety.SALMON, ProductVariety.LAMB, ProductVariety.IBERIAN_PORK];
  }, [species, stage]);

  useMemo(() => {
    if (!availableVarieties.includes(variety)) setVariety(availableVarieties[0]);
  }, [availableVarieties, variety]);

  const calculateDosage = (): DosageResult => {
    const rer = 70 * Math.pow(weight, 0.75);
    let f = activityFactor;
    if (stage === LifeStage.PUPPY_KITTEN) f = 3.0;
    if (stage === LifeStage.SENIOR || stage === LifeStage.SENIOR_MINI) f = 1.1; 
    if (stage === LifeStage.STERILIZED) f = (species === Species.CAT) ? 1.1 : 1.4;
    const der = rer * f;

    let grams = 0;
    let productName = "";
    let recommendedMeals = 2;
    const nutrients = ["Grain-Free", "Natural Ingredients", "Super Premium"];

    if (species === Species.DOG) {
      if (stage === LifeStage.PUPPY_KITTEN) {
        recommendedMeals = ageMonths <= 4 ? 4 : 3;
        const isMiniPuppy = weight < 8; 
        productName = `Bravery ${variety} ${isMiniPuppy ? 'Mini' : 'Medium/Large'} Puppy`;
        const table = isMiniPuppy ? BRAVERY_DATA.DOG_PUPPY_MINI : BRAVERY_DATA.DOG_PUPPY_MED_LARGE;
        
        const sortedAdultWeights = Object.keys(table).map(Number).sort((a, b) => a - b);
        let w0 = sortedAdultWeights[0], w1 = sortedAdultWeights[sortedAdultWeights.length - 1];
        for (let i = 0; i < sortedAdultWeights.length - 1; i++) {
          if (weight >= sortedAdultWeights[i] && weight <= sortedAdultWeights[i + 1]) {
            w0 = sortedAdultWeights[i]; w1 = sortedAdultWeights[i + 1]; break;
          }
        }
        const getValForMonth = (w: number, m: number) => {
          const entry = table[w as keyof typeof table];
          const months = Object.keys(entry).map(Number).sort((a, b) => a - b);
          let m0 = months[0], m1 = months[months.length - 1];
          for (let i = 0; i < months.length - 1; i++) {
            if (m >= months[i] && m <= months[i + 1]) { m0 = months[i]; m1 = months[i + 1]; break; }
          }
          return interpolate(m, m0, entry[m0], m1, entry[m1]);
        };
        const v0 = getValForMonth(w0, ageMonths);
        const v1 = getValForMonth(w1, ageMonths);
        grams = interpolate(weight, w0, v0, w1, v1);

      } else if (stage === LifeStage.ADULT_MINI) {
        productName = `Bravery ${variety} Mini Adult Small Breeds`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.DOG_ADULT_MINI);
      } else if (stage === LifeStage.LIGHT_MINI) {
        productName = `Bravery Light Iberian Pork Mini Small Breeds`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.DOG_LIGHT_MINI);
      } else if (stage === LifeStage.LIGHT) {
        productName = `Bravery Light Iberian Pork Adult Medium/Large`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.DOG_LIGHT_MED_LARGE);
      } else if (stage === LifeStage.SENIOR_MINI) {
        productName = `Bravery Herring Senior Mini Small Breeds`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.DOG_SENIOR_MINI);
      } else if (stage === LifeStage.SENIOR) {
        productName = `Bravery Herring Senior Adult Medium/Large`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.DOG_SENIOR_MED_LARGE);
      } else {
        productName = `Bravery ${variety} Adult Medium/Large Breeds`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.DOG_ADULT_MED_LARGE);
      }
    } else {
      // GATOS
      if (stage === LifeStage.PUPPY_KITTEN) {
        productName = "Bravery Chicken Kitten";
        recommendedMeals = 4;
        const table = BRAVERY_DATA.CAT_KITTEN;
        const keys = Object.keys(table);
        const monthKey = ageMonths <= 2 ? keys[0] : ageMonths <= 4 ? keys[1] : ageMonths <= 6 ? keys[2] : ageMonths <= 9 ? keys[3] : keys[4];
        grams = table[monthKey as keyof typeof table];
      } else if (stage === LifeStage.STERILIZED) {
        productName = `Bravery Sterilized ${variety}`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.CAT_STERILIZED);
      } else if (stage === LifeStage.SENIOR) {
        productName = "Bravery Herring Senior Cat (7+ años)";
        grams = getInterpolatedRation(weight, BRAVERY_DATA.CAT_SENIOR);
      } else {
        productName = `Bravery Adult Cat ${variety}`;
        grams = getInterpolatedRation(weight, BRAVERY_DATA.CAT_ADULT);
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

  const result = useMemo(calculateDosage, [species, stage, variety, weight, ageMonths, activityFactor]);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      doc.setFillColor(26, 61, 52); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(242, 233, 210);
      doc.setFontSize(22); doc.text('BRAVERY NUTRI-DOSAGE', 20, 22);
      doc.setFontSize(10); doc.text(`SOPORTE NUTRICIONAL DE ALTA PRECISIÓN - ${new Date().toLocaleDateString()}`, 20, 32);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14); doc.text('1. EVALUACIÓN BIOENERGÉTICA', 20, 55);
      autoTable(doc, {
        startY: 60,
        body: [
          ['PACIENTE', `${species} - ${weight} kg`],
          ['ALIMENTO', result.productName],
          ['ETAPA', stage],
          ['BASAL (RER)', `${result.rer} kcal/día`],
          ['MANTENIMIENTO (DER)', `${result.der} kcal/día`]
        ],
        theme: 'plain', styles: { fontSize: 10 }
      });

      doc.setFontSize(14); doc.text('2. INDICACIONES TÉCNICAS', 20, 115);
      doc.setTextColor(26, 61, 52);
      doc.setFontSize(30); doc.text(`${result.gramsPerDay}g / DÍA`, 25, 130);
      doc.setFontSize(11); doc.setTextColor(100, 116, 139);
      doc.text(`Frecuencia: ${result.recommendedMeals} tomas diarias recomendadas.`, 25, 142);
      doc.text(`Nota: Ajustar según condición corporal (BCS).`, 25, 150);

      doc.save(`Bravery_Dosificacion_${weight}kg.pdf`);
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf9] flex flex-col font-sans">
      <header className="bg-[#1a3d34] border-b border-[#254d42] sticky top-0 z-50 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col group cursor-pointer">
            <h1 className="text-3xl font-black text-[#f2e9d2] tracking-tighter leading-none group-hover:scale-105 transition-transform">BRAVERY</h1>
            <p className="text-[#f2e9d2]/60 text-[10px] uppercase tracking-[0.4em] mt-1 ml-0.5 font-bold">Scientific Nutrition</p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="https://www.braverypetfood.com/" target="_blank" className="text-[#f2e9d2]/80 text-[11px] font-bold uppercase hover:text-white transition-colors">Official Website</a>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="bg-[#f2e9d2]/10 px-5 py-2 rounded-full border border-[#f2e9d2]/20 shadow-inner">
              <span className="text-[#f2e9d2] text-[10px] font-black uppercase tracking-widest">Precision Dosifier v6.5</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] border border-slate-100 p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 translate-x-1/4">
                 <CalcIcon size={400} />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                  <div className="bg-[#1a3d34] p-3 rounded-2xl shadow-lg">
                    <CalcIcon className="text-[#f2e9d2]" size={24} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Configuración Clínica</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {[Species.DOG, Species.CAT].map(s => (
                    <button key={s} onClick={() => {setSpecies(s); setWeight(s === Species.DOG ? 10 : 4); setStage(LifeStage.ADULT);}} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 font-black uppercase tracking-tight ${species === s ? 'border-[#1a3d34] bg-[#f0f4f3] text-[#1a3d34] shadow-[0_10px_25px_-10px_rgba(26,61,52,0.3)]' : 'border-slate-50 text-slate-400 hover:border-slate-200 bg-slate-50/50'}`}>
                      <span className="text-4xl mb-1">{s === Species.DOG ? '🐶' : '🐱'}</span>
                      {s}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Variedad Específica</label>
                    <select value={stage} onChange={e => setStage(e.target.value as LifeStage)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-slate-700 outline-none focus:ring-4 ring-[#1a3d34]/5 cursor-pointer appearance-none transition-shadow">
                      <option value={LifeStage.PUPPY_KITTEN}>{species === Species.DOG ? "Puppy (Cachorro)" : "Kitten (Gatito)"}</option>
                      {species === Species.DOG ? (
                        <>
                          <option value={LifeStage.ADULT_MINI}>Mini Adult (1-10kg)</option>
                          <option value={LifeStage.ADULT}>Medium/Large Adult (+12kg)</option>
                          <option value={LifeStage.SENIOR_MINI}>Mini Senior (1-10kg)</option>
                          <option value={LifeStage.SENIOR}>Medium/Large Senior (+12kg)</option>
                          <option value={LifeStage.LIGHT_MINI}>Mini Weight Control (1-10kg)</option>
                          <option value={LifeStage.LIGHT}>Med/Large Weight Control (+12kg)</option>
                        </>
                      ) : (
                        <>
                          <option value={LifeStage.ADULT}>Adult Cat (Mantenimiento)</option>
                          <option value={LifeStage.STERILIZED}>Sterilized Cat</option>
                          <option value={LifeStage.SENIOR}>Senior Cat (7+ años)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Factor Metabólico</label>
                    <select value={activityFactor} onChange={e => setActivityFactor(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-slate-700 outline-none focus:ring-4 ring-[#1a3d34]/5 cursor-pointer appearance-none">
                      <option value={1.2}>Bajo (Inactivo/Sedentario)</option>
                      <option value={1.4}>Moderado (Actividad Estándar)</option>
                      <option value={1.6}>Elevado (Atleta/Trabajo)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Proteína Disponible</label>
                      <span className="text-[9px] font-bold text-[#1a3d34] bg-[#f0f4f3] px-2 py-0.5 rounded-full uppercase">Selección Directa</span>
                   </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableVarieties.map(v => (
                      <button key={v} onClick={() => setVariety(v)} className={`p-4 rounded-2xl border text-[11px] font-black uppercase transition-all flex items-center justify-between px-5 ${variety === v ? 'bg-[#1a3d34] text-[#f2e9d2] border-[#1a3d34] shadow-lg scale-[1.02]' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100'}`}>
                        {v}
                        <ChevronRight size={14} className={variety === v ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-end px-1">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-[#1a3d34]"/> Peso Corporal</p>
                      <p className="text-[10px] text-slate-300 font-bold uppercase italic">Ajuste milimétrico para DER preciso</p>
                    </div>
                    <div className="bg-[#1a3d34] text-[#f2e9d2] px-6 py-2.5 rounded-2xl font-black text-2xl shadow-xl ring-8 ring-[#f2e9d2]/30 flex items-baseline gap-1 animate-pulse">
                      {weight} <span className="text-xs opacity-60 font-bold uppercase">kg</span>
                    </div>
                  </div>
                  <input type="range" min="0.5" max={species === Species.DOG ? 70 : 15} step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full h-3 bg-slate-100 rounded-full appearance-none accent-[#1a3d34] cursor-pointer shadow-inner border border-slate-50" />
                </div>

                {stage === LifeStage.PUPPY_KITTEN && (
                  <div className="space-y-5 pt-8 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-[#1a3d34]"/> Edad Madurativa</p>
                      <div className="bg-slate-100 text-[#1a3d34] px-5 py-2 rounded-2xl font-black text-sm border border-slate-200">
                        {ageMonths} <span className="text-[10px] opacity-60 uppercase">meses</span>
                      </div>
                    </div>
                    <input type="range" min="1" max="18" step="1" value={ageMonths} onChange={e => setAgeMonths(Number(e.target.value))} className="w-full h-2.5 bg-slate-100 rounded-full appearance-none accent-[#1a3d34] cursor-pointer" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#1a3d34] rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(26,61,52,0.4)] p-12 text-[#f2e9d2] sticky top-32 overflow-hidden border border-[#254d42] transition-all hover:shadow-[0_45px_90px_-20px_rgba(26,61,52,0.5)]">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-[2] rotate-12">
                 <ShieldCheck size={300} strokeWidth={1} />
              </div>
              
              <div className="relative z-10 space-y-12">
                <div className="space-y-2">
                  <h4 className="text-[#f2e9d2]/40 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Protocolo Técnico Recomendado</h4>
                  <p className="text-4xl font-black leading-none tracking-tighter mb-4 border-l-4 border-[#f2e9d2]/30 pl-6 py-1">{result.productName}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {result.keyNutrients.map(n => (
                      <span key={n} className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">{n}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-[3rem] border border-white/10 shadow-2xl relative group">
                   <div className="absolute top-4 right-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">High precision unit</div>
                   <p className="text-[#f2e9d2]/50 text-[11px] font-black uppercase tracking-[0.25em] mb-4">Ración Diaria Sugerida</p>
                   <div className="flex items-baseline gap-4">
                      <span className="text-[11rem] font-black tracking-tighter leading-none text-white drop-shadow-2xl animate-in fade-in zoom-in duration-700">{result.gramsPerDay}</span>
                      <span className="text-5xl font-black opacity-30 text-[#f2e9d2]">g</span>
                   </div>
                   <div className="mt-12 flex items-center gap-4 bg-[#f2e9d2] text-[#1a3d34] px-8 py-3.5 rounded-2xl shadow-2xl transform transition-transform group-hover:scale-110">
                      <Calendar size={18} strokeWidth={3} />
                      <p className="text-[13px] font-black uppercase tracking-tight italic">Dividir en {result.recommendedMeals} tomas diarias</p>
                   </div>
                </div>

                <button onClick={handleDownloadPDF} disabled={isGenerating} className="w-full bg-[#f2e9d2] text-[#1a3d34] font-black py-6 rounded-3xl shadow-[0_15px_35px_-10px_rgba(242,233,210,0.5)] hover:bg-white hover:-translate-y-2 active:translate-y-0 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                  <FileDown size={22} strokeWidth={3} /> 
                  <span className="text-sm tracking-widest">{isGenerating ? 'ANALIZANDO DATOS...' : 'DESCARGAR PROTOCOLO PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-[#1a3d34] rounded-[4rem] p-16 text-[#f2e9d2] relative overflow-hidden shadow-2xl group">
           <div className="relative z-10 max-w-4xl space-y-8">
              <h3 className="text-5xl font-black mb-8 tracking-tighter uppercase italic leading-none">Análisis por Variedad</h3>
              <p className="text-[#f2e9d2]/70 text-xl font-medium leading-relaxed max-w-2xl">
                Nuestro motor de cálculo ha sido verificado meticulosamente contra las tablas oficiales de Bravery. 
                Las dietas de <span className="text-[#f2e9d2] font-black">Senior y Weight Control</span> integran ajustes metabólicos 
                específicos para maximizar la longevidad y la condición física ideal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                 <div className="flex gap-6 items-start p-8 bg-white/5 rounded-[2.5rem] border border-white/10 transition-colors hover:bg-white/10">
                    <div className="bg-[#f2e9d2]/10 p-4 rounded-3xl"><Leaf className="text-[#f2e9d2]" size={32} /></div>
                    <div className="space-y-2">
                       <h5 className="font-black uppercase text-lg tracking-tight">Soporte Senior Herring</h5>
                       <p className="text-sm text-[#f2e9d2]/50 font-medium leading-relaxed">
                          Enriquecido con Omega-3 (EPA/DHA) para proteger la función renal y la movilidad articular en gatos y perros geriátricos.
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-6 items-start p-8 bg-white/5 rounded-[2.5rem] border border-white/10 transition-colors hover:bg-white/10">
                    <div className="bg-[#f2e9d2]/10 p-4 rounded-3xl"><Zap className="text-[#f2e9d2]" size={32} /></div>
                    <div className="space-y-2">
                       <h5 className="font-black uppercase text-lg tracking-tight">Control de Peso Ibérico</h5>
                       <p className="text-sm text-[#f2e9d2]/50 font-medium leading-relaxed">
                          Utiliza L-carnitina y fibra natural para acelerar el metabolismo de las grasas sin perder masa muscular magra.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="absolute bottom-0 right-0 p-16 opacity-[0.05] hidden lg:block group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck size={400} />
           </div>
        </section>
      </main>

      <footer className="py-20 text-center border-t border-slate-100 bg-white">
         <p className="text-[#1a3d34] text-[12px] font-black uppercase tracking-[0.5em] mb-3">BRAVERY PET FOOD • SCIENTIFIC CLINICAL SUPPORT</p>
         <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">High Fidelity Precision Nutrition Engine • All rights reserved • 2025</p>
      </footer>
    </div>
  );
};

export default App;
