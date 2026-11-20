// Every layer, view and fab step worth looking at. Used by shots.mjs.
const routes = [
  { name: 'home', path: '/' },
  { name: 'style', path: '/style', wait: 800 },
  { name: 'debug', path: '/debug' },
  { name: 'L1-wafer', path: '/cmos/wafer' },
  { name: 'L2-die', path: '/cmos/die' },
  { name: 'L3-cell', path: '/cmos/inverter' },
  { name: 'L4-nmos', path: '/cmos/inverter/nmos' },
  { name: 'L5-oxide', path: '/cmos/inverter/nmos/gate-oxide' },
  { name: 'L6-lattice', path: '/cmos/inverter/nmos/gate-oxide/lattice' },
]
export default routes
