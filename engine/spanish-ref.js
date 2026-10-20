/* Translate Scripture reference labels without inventing Bible text. */
(() => {
  'use strict';
  const books = new Map([["genesis","Génesis"],["exodus","Éxodo"],["leviticus","Levítico"],["numbers","Números"],["deuteronomy","Deuteronomio"],["joshua","Josué"],["judges","Jueces"],["ruth","Rut"],["1 samuel","1 Samuel"],["2 samuel","2 Samuel"],["1 kings","1 Reyes"],["2 kings","2 Reyes"],["1 chronicles","1 Crónicas"],["2 chronicles","2 Crónicas"],["ezra","Esdras"],["nehemiah","Nehemías"],["esther","Ester"],["job","Job"],["psalms","Salmos"],["proverbs","Proverbios"],["ecclesiastes","Eclesiastés"],["song of solomon","Cantares"],["isaiah","Isaías"],["jeremiah","Jeremías"],["lamentations","Lamentaciones"],["ezekiel","Ezequiel"],["daniel","Daniel"],["hosea","Oseas"],["joel","Joel"],["amos","Amós"],["obadiah","Abdías"],["jonah","Jonás"],["micah","Miqueas"],["nahum","Nahúm"],["habakkuk","Habacuc"],["zephaniah","Sofonías"],["haggai","Hageo"],["zechariah","Zacarías"],["malachi","Malaquías"],["matthew","Mateo"],["mark","Marcos"],["luke","Lucas"],["john","Juan"],["acts","Hechos"],["romans","Romanos"],["1 corinthians","1 Corintios"],["2 corinthians","2 Corintios"],["galatians","Gálatas"],["ephesians","Efesios"],["philippians","Filipenses"],["colossians","Colosenses"],["1 thessalonians","1 Tesalonicenses"],["2 thessalonians","2 Tesalonicenses"],["1 timothy","1 Timoteo"],["2 timothy","2 Timoteo"],["titus","Tito"],["philemon","Filemón"],["hebrews","Hebreos"],["james","Santiago"],["1 peter","1 Pedro"],["2 peter","2 Pedro"],["1 john","1 Juan"],["2 john","2 Juan"],["3 john","3 Juan"],["jude","Judas"],["revelation","Apocalipsis"]]);
  const translate = input => String(input||'').replace(/(?:^|[;,]\s*)([1-3]\s+)?([A-Za-z]+(?:\s+(?:of\s+)?[A-Za-z]+)*)\s+(\d{1,3}:\d{1,3}(?:\s*[-–—]\s*\d{1,3})?)/g,
    (full,num='',name='',verses='') => {
      const prefix=full.startsWith(';')?'; ':full.startsWith(',')?', ':'';
      const en=(num||'')+name.trim();
      const es=books.get(en.toLowerCase());
      return prefix+(es||en)+' '+verses;
    });
  window.MinistrySpanishRef=translate;
})();
