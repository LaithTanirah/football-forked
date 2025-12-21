export interface FormationSlot {
  key: string;
  role: 'GK' | 'DEF' | 'MID' | 'ATT';
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  label: { en: string; ar: string };
}

export interface Formation {
  id: string;
  mode: 5 | 6;
  name: { en: string; ar: string };
  slots: FormationSlot[];
}

// 5-a-side formations
export const formations5: Formation[] = [
  {
    id: '5_2-2',
    mode: 5,
    name: { en: '2-2', ar: '2-2' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DL', role: 'DEF', x: 30, y: 65, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DR', role: 'DEF', x: 70, y: 65, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'AL', role: 'ATT', x: 35, y: 25, label: { en: 'Attacker', ar: 'مهاجم' } },
      { key: 'AR', role: 'ATT', x: 65, y: 25, label: { en: 'Attacker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '5_1-2-1',
    mode: 5,
    name: { en: '1-2-1', ar: '1-2-1' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DM', role: 'DEF', x: 50, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'ML', role: 'MID', x: 30, y: 45, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'MR', role: 'MID', x: 70, y: 45, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'ST', role: 'ATT', x: 50, y: 20, label: { en: 'Striker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '5_1-1-2',
    mode: 5,
    name: { en: '1-1-2', ar: '1-1-2' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DM', role: 'DEF', x: 50, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'CM', role: 'MID', x: 50, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'AL', role: 'ATT', x: 35, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
      { key: 'AR', role: 'ATT', x: 65, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '5_3-1',
    mode: 5,
    name: { en: '3-1', ar: '3-1' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DL', role: 'DEF', x: 25, y: 65, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DC', role: 'DEF', x: 50, y: 65, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DR', role: 'DEF', x: 75, y: 65, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'ST', role: 'ATT', x: 50, y: 20, label: { en: 'Striker', ar: 'مهاجم' } },
    ],
  },
];

// 6-a-side formations
export const formations6: Formation[] = [
  {
    id: '6_2-2-1',
    mode: 6,
    name: { en: '2-2-1', ar: '2-2-1' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DL', role: 'DEF', x: 30, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DR', role: 'DEF', x: 70, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'ML', role: 'MID', x: 35, y: 45, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'MR', role: 'MID', x: 65, y: 45, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'ST', role: 'ATT', x: 50, y: 20, label: { en: 'Striker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '6_2-1-2',
    mode: 6,
    name: { en: '2-1-2', ar: '2-1-2' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DL', role: 'DEF', x: 30, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DR', role: 'DEF', x: 70, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'CM', role: 'MID', x: 50, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'AL', role: 'ATT', x: 35, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
      { key: 'AR', role: 'ATT', x: 65, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '6_1-2-2',
    mode: 6,
    name: { en: '1-2-2', ar: '1-2-2' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DC', role: 'DEF', x: 50, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'ML', role: 'MID', x: 35, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'MR', role: 'MID', x: 65, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'AL', role: 'ATT', x: 35, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
      { key: 'AR', role: 'ATT', x: 65, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '6_3-2',
    mode: 6,
    name: { en: '3-2', ar: '3-2' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DL', role: 'DEF', x: 25, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DC', role: 'DEF', x: 50, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'DR', role: 'DEF', x: 75, y: 70, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'AL', role: 'ATT', x: 35, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
      { key: 'AR', role: 'ATT', x: 65, y: 20, label: { en: 'Attacker', ar: 'مهاجم' } },
    ],
  },
  {
    id: '6_1-3-1',
    mode: 6,
    name: { en: '1-3-1', ar: '1-3-1' },
    slots: [
      { key: 'GK', role: 'GK', x: 50, y: 88, label: { en: 'Goalkeeper', ar: 'حارس المرمى' } },
      { key: 'DC', role: 'DEF', x: 50, y: 75, label: { en: 'Defender', ar: 'مدافع' } },
      { key: 'ML', role: 'MID', x: 30, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'MC', role: 'MID', x: 50, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'MR', role: 'MID', x: 70, y: 50, label: { en: 'Midfielder', ar: 'وسط' } },
      { key: 'ST', role: 'ATT', x: 50, y: 20, label: { en: 'Striker', ar: 'مهاجم' } },
    ],
  },
];

export function getFormationById(id: string): Formation | undefined {
  return [...formations5, ...formations6].find((f) => f.id === id);
}

export function getDefaultFormation(mode: 5 | 6): Formation {
  if (mode === 5) {
    return formations5[0]; // 2-2
  }
  return formations6[0]; // 2-2-1
}

