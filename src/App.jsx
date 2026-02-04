import React, { useState, useEffect, useRef } from 'react';
import './App.css';
// import Img from '../public/SENAI_Logo.png';
import Cardapio from './components/Cardapio';
import Avisos from './components/Avisos';
import Horarios from './components/Horarios';
import AlertaSonoro from './components/AlertaSonoro';

const Img = "/SENAI_Logo.png";

function App() {
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [tipoAlerta, setTipoAlerta] = useState('');
  const audioRef = useRef(null);

  const horarios = [
    { hora: '07:00', tipo: 'entrada', nome: 'Entrada' },
    { hora: '09:15', tipo: 'cafe', nome: 'Café da Manhã' },
    { hora: '11:00', tipo: 'almoco', nome: 'Almoço' },
    { hora: '14:15', tipo: 'cafe', nome: 'Café da Tarde' },
    { hora: '16:00', tipo: 'saida', nome: 'Saída' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const horaFormatada = horaAtual.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    horarios.forEach(horario => {
      if (horaFormatada === `${horario.hora}:00`) {
        ativarAlerta(horario.tipo, horario.nome);
      }
    });
  }, [horaAtual]);

const ativarAlerta = (tipo, nome) => {
  setTipoAlerta(tipo);
  setMostrarAlerta(true);
  
  // Define qual áudio tocar baseado no tipo de alerta
  let audioSrc = '';
  switch(tipo) {
    case 'cafe':
      // Café da manhã e café da tarde
      if (nome === 'Café da Manhã') {
        audioSrc = '/cafe_google.mp3';
      } else {
        audioSrc = '/Quero café.mp3';
      }
      break;
    case 'almoco':
      audioSrc = '/taNaHoraDoPaPa.mp3';
      break;
    default:
      audioSrc = '/alarme.mp3'; // Som padrão para entrada e saída
  }
  
  // Cria um novo elemento de áudio para tocar
  const audio = new Audio(audioSrc);
  audio.play().catch(err => console.log('Erro ao tocar áudio:', err));

  // Esconde o alerta após 10 segundos
  setTimeout(() => {
    setMostrarAlerta(false);
  }, 10000);
};

  return (
    <div className="App">
      <header className="header">
        <div className="logo-container">
          {/* Logo simulada do SENAI */}
          <div className="senai-logo">
            <img src={Img} alt="Logo do SENAI" className='logoSenai'/>
            {/* <span className="senai-text">SENAI</span>
            <div className="senai-unidade">SÃO PAULO</div> */}
          </div>
          <div className="divisor"></div>
          <h1>PAINEL DE GESTÃO ESCOLAR</h1>
        </div>
        
        <div className="relogio-container">
          <div className="hora">{horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="data">
            {horaAtual.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long'
            })}
          </div>
        </div>
      </header>

      <AlertaSonoro 
        mostrar={mostrarAlerta} 
        tipo={tipoAlerta}
        nome={horarios.find(h => h.tipo === tipoAlerta)?.nome}
      />

      <main className="conteudo-principal">
        {/* Coluna Horários - 25% */}
        <aside className="coluna-horarios">
          <Horarios horarios={horarios} horaAtual={horaAtual} />
        </aside>
        
        {/* Coluna Cardápio - 75% */}
        <section className="coluna-cardapio">
          <Cardapio />
          {/* Caso queira voltar os avisos futuramente, eles podem entrar aqui ou em um modal */}
        </section>
      </main>

      <audio ref={audioRef} src="/alarme.mp3" preload="auto" />
      
      <footer className="rodape">
        <div className="rodape-info">
          &copy; 2026 SENAI-SP - Serviço Nacional de Aprendizagem Industrial
        </div>
      </footer>
    </div>
  );
}

export default App;