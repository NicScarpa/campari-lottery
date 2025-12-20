// Lista di nomi maschili italiani comuni
// Tutti i nomi sono in minuscolo e senza accenti per facilitare il matching
// NOTA: "Andrea" in Italia e' prevalentemente maschile

export const MALE_NAMES = new Set([
  // Nomi classici italiani
  'marco', 'luca', 'andrea', 'matteo', 'alessandro', 'francesco', 'lorenzo',
  'davide', 'simone', 'federico', 'giuseppe', 'antonio', 'giovanni', 'stefano',
  'roberto', 'michele', 'daniele', 'paolo', 'riccardo', 'gabriele', 'filippo',
  'nicola', 'fabio', 'emanuele', 'alberto', 'tommaso', 'leonardo', 'edoardo',
  'massimo', 'mario', 'luigi', 'vincenzo', 'salvatore', 'carlo', 'angelo',
  'franco', 'raffaele', 'domenico', 'pietro', 'sergio', 'enrico', 'maurizio',
  'claudio', 'giorgio', 'gianluca', 'gianni', 'luciano', 'bruno', 'enzo',
  'gianfranco', 'piero', 'silvio', 'cesare', 'renato', 'guido', 'umberto',
  'aldo', 'adriano', 'vittorio', 'renzo', 'dario', 'mauro', 'fernando',
  'eugenio', 'carlo', 'ernesto', 'arturo', 'camillo', 'fabrizio', 'corrado',

  // Nomi moderni e popolari
  'giacomo', 'christian', 'manuel', 'mirko', 'mirco', 'ivan', 'igor', 'erik',
  'kevin', 'alex', 'denis', 'dennis', 'patrick', 'jonathan', 'ryan', 'dylan',
  'bryan', 'brian', 'michael', 'thomas', 'daniel', 'samuel', 'samuele',
  'nicholas', 'nicolas', 'fabiano', 'fabian', 'loris', 'boris', 'omar',
  'alan', 'alan', 'elvis', 'eros', 'romeo', 'rocco', 'remo', 'romolo',
  'tiziano', 'moreno', 'marino', 'mariano', 'martino', 'massimiliano',
  'marcello', 'maurilio', 'nando', 'nando', 'nunzio', 'orazio', 'oscar',
  'otello', 'ottavio', 'osvaldo', 'patrizio', 'pino', 'primo', 'prospero',

  // Nomi con varianti
  'giancarlo', 'gianmaria', 'gianpaolo', 'gianpiero', 'gianmarco',
  'giambattista', 'giampaolo', 'giampiero', 'giordano', 'giuliano',
  'giulio', 'graziano', 'gregorio', 'guglielmo', 'igino', 'ignazio',
  'ivo', 'jacopo', 'lauro', 'lazzaro', 'leandro', 'lello', 'leo',
  'leone', 'leonida', 'leopoldo', 'libero', 'livio', 'lodovico',
  'lucio', 'ludovico', 'manlio', 'manolo', 'marcantonio', 'marcolino',

  // Nomi stranieri comuni in Italia
  'martin', 'mattia', 'max', 'maicol', 'michael', 'miguel', 'mohamed',
  'mohammed', 'nathan', 'neal', 'neil', 'nelson', 'nick', 'niko',
  'noah', 'noel', 'norman', 'oliver', 'oreste', 'orlando', 'pablo',
  'pasquale', 'paul', 'peter', 'pier', 'pierluigi', 'piermario',
  'piersilvio', 'piervincenzo', 'primo', 'quinto', 'quintino',

  // Nomi religiosi e tradizionali
  'agostino', 'albano', 'alberico', 'alcide', 'alessandro', 'alfio',
  'alfredo', 'amadeo', 'amedeo', 'ambrogio', 'anacleto', 'anastasio',
  'anselmo', 'antonino', 'arcangelo', 'archibaldo', 'aristide', 'armando',
  'arnaldo', 'arsenio', 'attilio', 'augusto', 'aurelio', 'barnaba',
  'bartolomeo', 'basilio', 'battista', 'beniamino', 'benito', 'bernardo',
  'biagio', 'bortolo', 'calogero', 'cataldo', 'celestino', 'cesario',
  'clemente', 'colombano', 'corinto', 'cornelio', 'cosimo', 'costantino',
  'cristiano', 'cristoforo', 'damiano', 'dino', 'donato', 'edgardo',
  'edmondo', 'egidio', 'eligio', 'elio', 'elpidio', 'emidio', 'emilio',
  'emmanuele', 'ennio', 'eraclio', 'ercole', 'ermenegildo', 'ermete',
  'erminio', 'ettore', 'evaristo', 'ezechiele', 'ezio', 'fabiano',
  'fausto', 'felice', 'ferdinando', 'ferruccio', 'filiberto', 'fiorenzo',
  'flaminio', 'flavio', 'floriano', 'fortunato', 'fulvio', 'gaetano',
  'gaspare', 'gastone', 'gennaro', 'gerardo', 'germano', 'gerolamo',
  'gesualdo', 'gino', 'giobbe', 'gioacchino', 'gionata', 'giosuee',
  'girolamo', 'gustavo',

  // Nomi trendy recenti
  'diego', 'dino', 'domenico', 'donato', 'elia', 'elias', 'emiliano',
  'ennio', 'enrico', 'erminio', 'ettore', 'eugenio', 'ezio', 'federico',
  'felice', 'ferdinando', 'filippo', 'flavio', 'francesco', 'franco',
  'fulvio', 'gabriel', 'gaetano', 'gaspare', 'gerardo', 'giacinto',
  'gioele', 'giordano', 'giovanni', 'giulio', 'gregorio', 'guglielmo',
  'ian', 'ilario', 'ismaele', 'italo', 'ivan', 'ivo', 'jacob', 'jacopo',
  'jari', 'joshua', 'julian', 'kriss', 'lamberto', 'lando', 'lazzaro',
  'leandro', 'lenny', 'leo', 'leonardo', 'leone', 'leopoldo', 'liam',
  'libero', 'livio', 'lorenzo', 'luca', 'lucio', 'luigi', 'manfredi',
  'manuel', 'marcello', 'marco', 'marius', 'massimo', 'mattia', 'mauro',
  'michele', 'mirko', 'nelson', 'nico', 'nicolo', 'noah', 'noel', 'orlando',
  'oscar', 'osvaldo', 'ottone', 'pasquale', 'patrizio', 'pietro', 'pino',
  'raul', 'remo', 'riccardo', 'rinaldo', 'roberto', 'rocco', 'rodolfo',
  'ruben', 'ruggero', 'salvatore', 'sandro', 'sebastiano', 'sergio',
  'silvano', 'silvestro', 'silvio', 'simone', 'stefano', 'taddeo', 'tancredi',
  'teodoro', 'tiberio', 'tito', 'tiziano', 'tommaso', 'ugo', 'ulisse',
  'umberto', 'urbano', 'valentino', 'valerio', 'valter', 'walter',
  'vittorino', 'vittorio', 'vladimiro', 'walter', 'zaccaria', 'zeno',

  // Diminutivi comuni
  'ale', 'anto', 'beppe', 'calo', 'checco', 'ciro', 'dado', 'dade',
  'fede', 'fra', 'gio', 'giaco', 'gimmi', 'jimmy', 'lele', 'lollo',
  'manu', 'matte', 'michi', 'nico', 'pippo', 'ricky', 'roby', 'sandro',
  'simo', 'stefy', 'teo', 'tino', 'toni', 'tony', 'vale', 'vitto',
]);
