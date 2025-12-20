// Lista di nomi femminili italiani comuni
// Tutti i nomi sono in minuscolo e senza accenti per facilitare il matching

export const FEMALE_NAMES = new Set([
  // Nomi classici italiani
  'maria', 'anna', 'giulia', 'francesca', 'sara', 'laura', 'valentina',
  'chiara', 'alessia', 'federica', 'elena', 'silvia', 'martina', 'elisa',
  'paola', 'giorgia', 'monica', 'simona', 'daniela', 'cristina', 'roberta',
  'barbara', 'alessandra', 'ilaria', 'serena', 'michela', 'veronica',
  'beatrice', 'alice', 'aurora', 'sofia', 'emma', 'gaia', 'giada', 'noemi',
  'rebecca', 'camilla', 'arianna', 'eleonora', 'irene', 'ludovica', 'bianca',
  'giovanna', 'rosa', 'teresa', 'lucia', 'patrizia', 'antonella', 'claudia',
  'manuela', 'sabrina', 'stefania', 'angela', 'luisa', 'carla', 'grazia',
  'giuseppina', 'margherita', 'caterina', 'carlotta', 'marta', 'virginia',
  'valeria', 'viviana', 'romina', 'lorena', 'loredana', 'nicoletta',
  'elisabetta', 'donatella', 'emanuela', 'raffaella', 'cinzia', 'tiziana',
  'ornella', 'gabriella', 'concetta', 'assunta', 'carmela', 'filomena',
  'antonietta', 'addolorata', 'immacolata', 'nunzia', 'cosima', 'vita',

  // Nomi moderni e popolari
  'giuliana', 'rossella', 'marika', 'katia', 'sonia', 'nadia', 'milena',
  'mirella', 'miriam', 'debora', 'samantha', 'jessica', 'jennifer', 'vanessa',
  'pamela', 'fabiana', 'diana', 'denise', 'desire', 'desireee', 'eliana',
  'elvira', 'enrica', 'erika', 'erica', 'ester', 'eva', 'evelyn', 'fabiola',
  'fiorella', 'flora', 'floriana', 'flavia', 'franca', 'fulvia', 'gemma',
  'gilda', 'gina', 'ginevra', 'gioia', 'gisella', 'giusy', 'gloria',
  'graziella', 'greta', 'ida', 'ilenia', 'ileana', 'imma', 'ines', 'ingrid',
  'isabella', 'isadora', 'ivana', 'ivonne', 'lara', 'larissa', 'lavinia',
  'lea', 'leila', 'lelia', 'letizia', 'lia', 'liana', 'lidia', 'lilia',
  'liliana', 'lina', 'linda', 'lisa', 'livia', 'lorella', 'luana', 'lucia',
  'luciana', 'lucilla', 'luigia', 'luna',

  // Nomi con varianti
  'maddalena', 'mafalda', 'maira', 'manola', 'marcella', 'mariella',
  'mariangela', 'mariapia', 'mariarosa', 'mariateresa', 'marianna',
  'marica', 'marilena', 'marina', 'marinella', 'marisa', 'maristella',
  'marzia', 'matilde', 'maura', 'melissa', 'melody', 'micaela', 'mina',
  'miranda', 'mirella', 'miriam', 'mirta', 'moira', 'morena', 'nadia',
  'natalia', 'natasha', 'natascia', 'nella', 'nicolina', 'nina', 'nives',
  'nora', 'norina', 'norma', 'nuccia', 'odette', 'olga', 'olimpia',
  'olivia', 'ombretta', 'oriana', 'orietta', 'ornella', 'orsola',

  // Nomi stranieri comuni in Italia
  'paris', 'penelope', 'petra', 'pia', 'piera', 'pierangela', 'pierina',
  'priscilla', 'rachele', 'raffaela', 'ramona', 'regina', 'renata', 'rita',
  'roberta', 'romilda', 'rosalba', 'rosalia', 'rosanna', 'rosaria',
  'rosella', 'rosetta', 'rosy', 'ruth', 'sabina', 'samira', 'sandra',
  'santina', 'savina', 'selene', 'selvaggia', 'silvana', 'simona',
  'simonetta', 'sissy', 'smeralda', 'sole', 'soledad', 'sonia', 'stella',
  'susanna', 'sveva', 'tamara', 'tania', 'tatiana', 'tecla', 'tina',
  'tosca', 'tullia', 'ursula', 'valentina', 'valeria', 'vanda', 'vanessa',
  'vanna', 'vera', 'verdiana', 'veronica', 'viola', 'violetta', 'virginia',
  'vittoria', 'viviana', 'wanda', 'wilma', 'ylenia', 'yolanda', 'zoe',

  // Nomi religiosi e tradizionali
  'adorazione', 'agata', 'agnese', 'alba', 'alberta', 'albina', 'alda',
  'alfonsina', 'amalia', 'amelia', 'america', 'andreina', 'angelica',
  'annalisa', 'annamaria', 'annunziata', 'antonia', 'apollonia', 'armida',
  'assuntina', 'augusta', 'aurelia', 'benedetta', 'berenice', 'bernadette',
  'berta', 'bruna', 'brunella', 'carolina', 'celeste', 'cesira', 'clara',
  'clelia', 'clementina', 'clotilde', 'colomba', 'consolata', 'corinna',
  'cornelia', 'costanza', 'dalia', 'dalila', 'daria', 'delfina', 'delia',
  'diletta', 'dina', 'dolores', 'domenica', 'domitilla', 'dora', 'dorina',
  'doriana', 'dorotea', 'edda', 'edith', 'edoarda', 'edvige', 'elda',

  // Nomi trendy recenti
  'adele', 'agostina', 'aida', 'aileen', 'aimee', 'alena', 'alexia',
  'alma', 'ambra', 'amelia', 'amelie', 'amedea', 'anastasia', 'angelina',
  'anita', 'anna', 'annabella', 'arabella', 'ariana', 'artemisia',
  'asia', 'azzurra', 'cloe', 'chloe', 'clarissa', 'costanza', 'dafne',
  'elsa', 'emily', 'federica', 'fiamma', 'francesca', 'frida', 'greta',
  'isabel', 'jasmine', 'lavanda', 'leila', 'leonora', 'lidia', 'luce',
  'maddalena', 'margot', 'maya', 'mia', 'nadia', 'nicole', 'nina', 'nora',
  'ottavia', 'perla', 'priscilla', 'rebecca', 'rosa', 'ruth', 'sabrina',
  'samanta', 'sharon', 'sibilla', 'silvia', 'sofia', 'sonja', 'sveva',
  'tanya', 'teresa', 'tiffany', 'tiziana', 'valentina', 'vanessa',
  'vittoria', 'zaira', 'zelda', 'zita',

  // Diminutivi comuni
  'ale', 'anto', 'bea', 'cate', 'ceci', 'cla', 'cri', 'dani', 'eli',
  'fede', 'fra', 'gio', 'giuly', 'lau', 'lety', 'lucy', 'manu', 'mari',
  'mati', 'michi', 'roby', 'rosy', 'simo', 'stefy', 'vale', 'vero', 'vicky',
]);
