// Feriados nacionais brasileiros 2024-2028
// Inclui feriados fixos e moveis (Pascoa, Carnaval, Corpus Christi)

interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

// Feriados fixos que se repetem todo ano
const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: 'Confraternizacao Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independencia do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamacao da Republica' },
  { month: 12, day: 25, name: 'Natal' },
];

// Feriados moveis por ano (calculados com base na Pascoa)
const MOBILE_HOLIDAYS: Record<number, Holiday[]> = {
  2024: [
    { date: '2024-02-12', name: 'Carnaval' },
    { date: '2024-02-13', name: 'Carnaval' },
    { date: '2024-03-29', name: 'Sexta-feira Santa' },
    { date: '2024-03-31', name: 'Pascoa' },
    { date: '2024-05-30', name: 'Corpus Christi' },
  ],
  2025: [
    { date: '2025-03-03', name: 'Carnaval' },
    { date: '2025-03-04', name: 'Carnaval' },
    { date: '2025-04-18', name: 'Sexta-feira Santa' },
    { date: '2025-04-20', name: 'Pascoa' },
    { date: '2025-06-19', name: 'Corpus Christi' },
  ],
  2026: [
    { date: '2026-02-16', name: 'Carnaval' },
    { date: '2026-02-17', name: 'Carnaval' },
    { date: '2026-04-03', name: 'Sexta-feira Santa' },
    { date: '2026-04-05', name: 'Pascoa' },
    { date: '2026-06-04', name: 'Corpus Christi' },
  ],
  2027: [
    { date: '2027-02-08', name: 'Carnaval' },
    { date: '2027-02-09', name: 'Carnaval' },
    { date: '2027-03-26', name: 'Sexta-feira Santa' },
    { date: '2027-03-28', name: 'Pascoa' },
    { date: '2027-05-27', name: 'Corpus Christi' },
  ],
  2028: [
    { date: '2028-02-28', name: 'Carnaval' },
    { date: '2028-02-29', name: 'Carnaval' },
    { date: '2028-04-14', name: 'Sexta-feira Santa' },
    { date: '2028-04-16', name: 'Pascoa' },
    { date: '2028-06-15', name: 'Corpus Christi' },
  ],
};

export function getHolidays(year: number): Holiday[] {
  const fixed: Holiday[] = FIXED_HOLIDAYS.map((h) => ({
    date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
    name: h.name,
  }));

  const mobile = MOBILE_HOLIDAYS[year] || [];

  return [...fixed, ...mobile].sort((a, b) => a.date.localeCompare(b.date));
}

export function isNationalHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const holidays = getHolidays(year);
  return holidays.some((h) => h.date === dateStr);
}

export function isCourtRecess(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Recesso forense: 20/dez a 20/jan
  if (month === 12 && day >= 20) return true;
  if (month === 1 && day <= 20) return true;

  return false;
}
