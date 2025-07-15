class NumabraApp {
    constructor() {
      this.ALPHABET = {
        "A": 1, "Á": 1, "B": 2, "C": 3, "D": 4, "E": 5, "É": 5, "F": 6, "G": 7, "H": 8, 
        "I": 9, "Í": 9, "J": 10, "K": 20, "L": 30, "M": 40, "N": 50, "Ñ": 60, "O": 70, 
        "Ó": 70, "P": 80, "Q": 90, "R": 100, "S": 200, "T": 300, "U": 400, "Ú": 400, 
        "Ū": 400, "V": 500, "W": 600, "X": 700, "Y": 800, "Z": 900
      };
      
      this.currentLanguage = "en";
      this.wordData = {
        en: null,
        es: null
      };
      
      this.initElements();
      this.initEventListeners();
      this.loadInitialData();
    }
    
    initElements() {
      this.elements = {
        wordsInput: document.getElementById('wordsInput'),
        calculateButton: document.getElementById('calculateButton'),
        resultsTable: document.getElementById('resultsTable'),
        resultsBody: document.querySelector('#resultsTable tbody'),
        languageSelect: document.getElementById('languageSelect'),
        title: document.getElementById('title'),
        footerText: document.getElementById('footerText'),
        blog: document.getElementById('blog'),
        reddit: document.getElementById('reddit'),
        donations: document.getElementById('donations'),
        moreInfo: document.getElementById('moreInfo'),
        loadingMessage: document.getElementById('loadingMessage'),
        contactText: document.getElementById('contactText')
      };
    }
    
    initEventListeners() {
      this.elements.languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));
      this.elements.calculateButton.addEventListener('click', () => this.handleCalculate());
    }
    
    async loadInitialData() {
      try {
        await Promise.all([
          this.fetchWordData('en', "1619235635"),
          this.fetchWordData('es', "678152154")
        ]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        alert("Failed to load word data. Please try again later.");
      }
    }
    
    async fetchWordData(language, gid) {
      const url = `https://docs.google.com/spreadsheets/d/1hC4yZam7GBcKNixE0Hm_sW-k2g6WDmaw/export?format=csv&gid=${gid}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${language} data`);
      }
      
      const data = await response.text();
      this.wordData[language] = data.split('\n').map(row => row.split(','));
      return this.wordData[language];
    }
    
    get translations() {
      return {
        en: {
          title: "Numabra",
          placeholder: "Enter words or numeric values, separated by commas, to find matches...\nAsk questions, look for names, decode short texts, find out which words are linked to others...",
          calculateButton: "Calculate",
          footer: "Author: Leonel Elizondo - December 2024",
          contact: "Contact me",
          error: "Please enter some words to calculate.",
          blog: "Personal Blog",
          reddit: "Reddit Discussion",
          donations: "Contributions",
          moreInfo: "More About Numabra",
          noMatches: "-"
        },
        es: {
          title: "Numabra",
          placeholder: "Ingrese palabras o valores numéricos, separados por comas, para encontrar coincidencias...\nHaga preguntas, busque nombres, decodifique textos breves, averigüe qué palabras están ligadas con otras...",
          calculateButton: "Calcular",
          footer: "Autor: Leonel Elizondo - Diciembre 2024",
          contact: "Contacto",
          error: "Por favor, ingrese alguna palabra a calcular.",
          blog: "Blog Personal",
          reddit: "Reddit para Discusión",
          donations: "Aportes",
          moreInfo: "Más sobre Numabra",
          noMatches: "-"
        }
      };
    }
    
    updateLanguage(language) {
      this.currentLanguage = language;
      const t = this.translations[language];
      
      this.elements.title.textContent = t.title;
      this.elements.wordsInput.placeholder = t.placeholder;
      this.elements.calculateButton.textContent = t.calculateButton;
      this.elements.footerText.innerHTML = `${t.footer}<br><a href="mailto:numabra594@gmail.com">${t.contact}</a>`;
      this.elements.blog.textContent = t.blog;
      this.elements.reddit.textContent = t.reddit;
      this.elements.donations.textContent = t.donations;
      this.elements.moreInfo.textContent = t.moreInfo;
    }
    
    handleLanguageChange(event) {
      this.updateLanguage(event.target.value);
    }
    
    toggleLoading(show) {
      this.elements.loadingMessage.style.display = show ? 'block' : 'none';
      this.elements.calculateButton.disabled = show;
      this.elements.resultsTable.style.display = show ? 'none' : 'table';
    }
    
    isNumeric(value) {
      return !isNaN(value) && !isNaN(parseFloat(value));
    }
    
    calculateWordValue(word) {
      return Array.from(word.toUpperCase()).reduce(
        (sum, letter) => sum + (this.ALPHABET[letter] || 0),
        0
      );
    }
    
    async findWordMatches(word, value) {
      if (!this.wordData[this.currentLanguage]) {
        await this.fetchWordData(this.currentLanguage, 
          this.currentLanguage === 'en' ? "1619235635" : "678152154");
      }
      
      const words = this.wordData[this.currentLanguage];
      return words
        .filter(row => (parseInt(row[1]) === value && 
                       row[0].toLowerCase() !== word.toLowerCase()))
        .map(row => row[0]);
    }
    
    async handleCalculate() {
      const input = this.elements.wordsInput.value.trim();
      
      if (!input) {
        alert(this.translations[this.currentLanguage].error);
        return;
      }
      
      this.toggleLoading(true);
      
      try {
        const words = input.split(',').map(w => w.trim()).filter(w => w);
        const noWordToken = "-";
        const t = this.translations[this.currentLanguage];
        
        const results = await Promise.all(
          words.map(async word => {
            const isWord = !this.isNumeric(word);
            const value = isWord ? this.calculateWordValue(word) : parseInt(word);
            const wordUsed = isWord ? word : noWordToken;
            
            const matches = await this.findWordMatches(wordUsed, value);
            return {
              word: wordUsed,
              value,
              matches: matches.length ? matches.join(', ') : t.noMatches
            };
          })
        );
        
        this.displayResults(results);
      } catch (error) {
        console.error("Calculation error:", error);
        alert("An error occurred during calculation. Please try again.");
      } finally {
        this.toggleLoading(false);
      }
    }
    
    displayResults(results) {
      this.elements.resultsBody.innerHTML = results
        .map(result => `
          <tr>
            <td>${result.word}</td>
            <td>${result.value}</td>
            <td>${result.matches}</td>
          </tr>
        `)
        .join('');
      
      this.elements.resultsTable.style.display = 'table';
      this.addCopyButtonIfNeeded(results);
    }
    
    addCopyButtonIfNeeded(results) {
      if (document.getElementById('copyButton')) return;
      
      const copyButton = document.createElement('button');
      copyButton.id = 'copyButton';
      copyButton.textContent = this.translations[this.currentLanguage].calculateButton === "Calculate" 
        ? "Copy Results" 
        : "Copiar Resultados";
      copyButton.style.marginTop = '10px';
      
      copyButton.addEventListener('click', () => {
        const textToCopy = results
          .map(result => `${result.word}\t${result.value}\t${result.matches}`)
          .join('\n');
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => alert(this.translations[this.currentLanguage].calculateButton === "Calculate" 
            ? "Results copied to clipboard." 
            : "Resultados copiados al portapapeles."))
          .catch(err => console.error("Copy failed:", err));
      });
      
      this.elements.resultsTable.parentElement.appendChild(copyButton);
    }
  }
  
  // Initialize the application when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new NumabraApp();
  });