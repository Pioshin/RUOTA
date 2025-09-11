# 📁 Cartella Frasi JSON

Questa cartella contiene i file JSON con le frasi per il gioco della Ruota della Fortuna.

## 🔧 Come aggiungere nuovi set di frasi

1. **Crea un nuovo file JSON** nella cartella `phrases/` 
2. **Usa questo formato**:
```json
{
  "Nome Categoria 1": [
    "Prima frase della categoria",
    "Seconda frase della categoria",
    "Terza frase della categoria"
  ],
  "Nome Categoria 2": [
    "Frase di un'altra categoria",
    "Ancora una frase",
    "Un'altra frase ancora"
  ]
}
```

3. **Salva il file** con estensione `.json` (es: `mie-frasi.json`)
4. **Ricarica il gioco** - il nuovo file apparirà automaticamente nel selettore!

## 📝 Regole per le frasi

- ✅ Usa solo lettere, spazi e apostrofi
- ✅ Le frasi verranno convertite automaticamente in maiuscolo
- ✅ Evita frasi troppo lunghe (max ~50 caratteri)
- ✅ Puoi usare qualsiasi nome per categorie e file

## 📂 File attuali

- `phrases-1.json` - Scienza e Sport
- `phrases-2.json` - Latino e Greco Antico  
- `phrases-3.json` - Set personalizzato

## 🚀 Esempi di nomi file validi

- `frasi-natale.json`
- `quiz-storia.json`
- `movie-quotes.json`
- `sport-calcio.json`

Il sistema scoprirà automaticamente qualsiasi file `.json` in questa cartella!
