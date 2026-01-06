
export enum Species {
  DOG = 'PERRO',
  CAT = 'GATO'
}

export enum LifeStage {
  PUPPY_KITTEN = 'CACHORRO/GATITO',
  ADULT = 'ADULTO',
  SENIOR = 'SENIOR',
  STERILIZED = 'ESTERILIZADO',
  LIGHT = 'CONTROL DE PESO'
}

export enum BreedSize {
  MINI = 'MINI/PEQUEÑO',
  MEDIUM_LARGE = 'MEDIANO/GRANDE'
}

export enum ProductVariety {
  CHICKEN = 'POLLO',
  SALMON = 'SALMÓN',
  LAMB = 'CORDERO',
  IBERIAN_PORK = 'CERDO IBÉRICO',
  HERRING = 'ARENQUE'
}

export interface DosageResult {
  gramsPerDay: number;
  kcalPerDay: number;
  rer: number;
  der: number;
  productName: string;
  recommendedMeals: number;
  keyNutrients: string[];
}
