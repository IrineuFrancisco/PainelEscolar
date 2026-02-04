# 🚀 Guia de Início Rápido

## Começar em 5 Minutos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Iniciar o Projeto
```bash
npm start
```

### 3️⃣ Acessar
Abra o navegador em: **http://localhost:3000**

### 4️⃣ Tela Cheia
Pressione **F11** no navegador

---

## ⚡ Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila para produção |
| `npm test` | Executa testes |

---

## 🎯 Principais Arquivos para Editar

### Modificar Cardápio
📁 `src/components/Cardapio.jsx` → linha 10

### Modificar Horários
📁 `src/App.jsx` → linha 18

### Modificar Avisos
📁 `src/components/Avisos.jsx` → linha 9

### Modificar Cores
📁 `src/App.css` → linha 1

---

## 🔊 Adicionar Som de Alarme

1. Baixe um som MP3 (exemplo: sino escolar, campainha)
2. Renomeie para `alarme.mp3`
3. Coloque em `public/alarme.mp3`

**Fontes de sons gratuitos:**
- https://freesound.org
- https://mixkit.co/free-sound-effects/
- https://www.zapsplat.com

---

## 📺 Configurar na TV

### Windows
1. Instale o Chrome
2. Abra o painel: `http://localhost:3000`
3. Pressione F11 (tela cheia)
4. Configure inicialização automática:
   - Crie um atalho do Chrome com parâmetros:
   ```
   chrome.exe --kiosk http://localhost:3000
   ```
   - Adicione à pasta de inicialização do Windows

### Linux
1. Instale o Chromium
2. Configure autostart:
   ```bash
   chromium-browser --kiosk --disable-restore-session-state http://localhost:3000
   ```

### Raspberry Pi
1. Edite autostart:
   ```bash
   sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
   ```
2. Adicione:
   ```
   @chromium-browser --kiosk http://localhost:3000
   ```

---

## 🆘 Problemas Comuns

### "Cannot find module 'react'"
```bash
npm install
```

### Porta 3000 já em uso
```bash
PORT=3001 npm start
```

### Som não toca
- Verifique se `alarme.mp3` existe em `public/`
- Clique na página antes (alguns navegadores bloqueiam autoplay)
- Teste com volume alto

---

## ✨ Dicas

- Use **Ctrl + Shift + I** para abrir DevTools e ver erros
- Teste em diferentes resoluções de TV
- Configure o navegador para não dormir
- Desabilite protetor de tela no sistema operacional

---

**Pronto! Seu painel está funcionando! 🎉**
