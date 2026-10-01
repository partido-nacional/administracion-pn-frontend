import {
  rangoSemana, agruparPorDia, htmlCalendario, horaFin, tituloDia, tituloPeriodo, EventoImprimible,
} from './imprimir-calendario';

describe('imprimir-calendario (feature 030)', () => {
  const ev = (titulo: string, fechaInicio: string, extra: Partial<EventoImprimible> = {}): EventoImprimible =>
    ({ titulo, fechaInicio, esPublico: true, ...extra });

  describe('rangoSemana (BR-4)', () => {
    it('miércoles → lunes de esa semana y lunes siguiente', () => {
      expect(rangoSemana(new Date(2026, 8, 30))).toEqual({ desde: '2026-09-28', hasta: '2026-10-05' });
    });
    it('domingo pertenece a la semana que empezó el lunes anterior', () => {
      expect(rangoSemana(new Date(2026, 9, 4))).toEqual({ desde: '2026-09-28', hasta: '2026-10-05' });
    });
    it('lunes es el inicio de su propia semana', () => {
      expect(rangoSemana(new Date(2026, 9, 5))).toEqual({ desde: '2026-10-05', hasta: '2026-10-12' });
    });
  });

  describe('agruparPorDia', () => {
    const eventos = [
      ev('Tarde', '2026-10-01T18:00:00Z'),
      ev('Mañana', '2026-10-01T09:00:00Z'),
      ev('Lunes', '2026-09-28T10:00:00Z'),
      ev('Fuera', '2026-10-05T00:00:00Z'),
    ];

    it('semanal: 7 días, vacíos incluidos, orden cronológico, cruza de mes (AC-5, EC-3)', () => {
      const dias = agruparPorDia(eventos, '2026-09-28', '2026-10-05', true);
      expect(dias.map(d => d.iso)).toEqual(
        ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
      expect(dias[3].eventos.map(e => e.titulo)).toEqual(['Mañana', 'Tarde']);
      expect(dias[1].eventos).toEqual([]);
    });

    it('mensual: solo días con eventos', () => {
      const dias = agruparPorDia(eventos, '2026-10-01', '2026-11-01', false);
      expect(dias.map(d => d.iso)).toEqual(['2026-10-01', '2026-10-05']);
    });
  });

  it('horaFin: mismo día, otro día (EC-2), sin fin', () => {
    expect(horaFin(ev('a', '2026-10-01T09:00:00Z', { fechaFin: '2026-10-01T10:30:00Z' }))).toBe('10:30');
    expect(horaFin(ev('a', '2026-10-01T22:00:00Z', { fechaFin: '2026-10-02T02:00:00Z' }))).toBe('02/10 02:00');
    expect(horaFin(ev('a', '2026-10-01T09:00:00Z'))).toBe('—');
  });

  it('títulos de día y período', () => {
    expect(tituloDia('2026-09-28')).toBe('Lunes 28/09/2026');
    expect(tituloPeriodo('semana', '2026-09-28', '2026-10-05')).toBe('Semana del 28 de septiembre al 4 de octubre de 2026');
    expect(tituloPeriodo('mes', '2026-10-01', '2026-11-01')).toBe('Octubre 2026');
  });

  describe('htmlCalendario', () => {
    it('escapa el texto de usuario y marca privados (AC-6)', () => {
      const html = htmlCalendario({
        periodo: 'Octubre 2026', filtro: 'Todos',
        dias: [{ iso: '2026-10-01', eventos: [ev('<script>x</script>', '2026-10-01T09:00:00Z', { esPublico: false, descripcion: 'a & b' })] }],
      });
      expect(html).not.toContain('<script>x</script>');
      expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
      expect(html).toContain('a &amp; b');
      expect(html).toContain('🔒');
      expect(html).toContain('Calendario — Octubre 2026');
    });

    it('sin días → "Sin eventos en el período" (AC-7)', () => {
      expect(htmlCalendario({ periodo: 'p', filtro: 'f', dias: [] })).toContain('Sin eventos en el período');
    });

    it('día vacío en semanal → "(sin eventos)"', () => {
      expect(htmlCalendario({ periodo: 'p', filtro: 'f', dias: [{ iso: '2026-09-29', eventos: [] }] })).toContain('(sin eventos)');
    });
  });
});
