import React from 'react';
import './Horarios.css';

function Horarios({ horarios, horaAtual }) {
  const obterProximoHorario = () => {
    const horaAtualMinutos = horaAtual.getHours() * 60 + horaAtual.getMinutes();
    
    for (let horario of horarios) {
      const [hora, minuto] = horario.hora.split(':').map(Number);
      const horarioMinutos = hora * 60 + minuto;
      
      if (horarioMinutos > horaAtualMinutos) {
        return horario;
      }
    }
    return horarios[0]; 
  };

  const proximoHorario = obterProximoHorario();

  const getIcone = (tipo) => {
    const icones = {
      'entrada': '🔔',
      'cafe': '☕',
      'almoco': '🍽️',
      'saida': '🚪'
    };
    return icones[tipo] || '⏰';
  };

  return (
    <div className="card horarios-card">
      <h2 className="card-titulo">
        <span className="card-icone">⏰</span>
        Programação
      </h2>
      
      {/* Box de Próximo Evento - Destaque em Azul SENAI */}
      <div className="proximo-horario-box">
        <div className="proximo-header">PRÓXIMO EVENTO</div>
        <div className="proximo-main">
          <span className="proximo-hora-valor">{proximoHorario.hora}</span>
          <div className="proximo-detalhes">
            <span className="proximo-nome-texto">{proximoHorario.nome}</span>
            <span className="proximo-tag">AGORA</span>
          </div>
        </div>
      </div>

      <div className="lista-horarios">
        {horarios.map((horario, index) => {
          const [hora, minuto] = horario.hora.split(':').map(Number);
          const horarioMinutos = hora * 60 + minuto;
          const horaAtualMinutos = horaAtual.getHours() * 60 + horaAtual.getMinutes();
          const passou = horarioMinutos <= horaAtualMinutos;
          const eOProximo = proximoHorario === horario;

          return (
            <div 
              key={index} 
              className={`horario-linha ${passou ? 'status-passou' : ''} ${eOProximo ? 'status-proximo' : ''}`}
            >
              <div className="linha-tempo">
                <div className="ponto-linha"></div>
                {index !== horarios.length - 1 && <div className="conector-linha"></div>}
              </div>
              
              <div className="horario-conteudo">
                <span className="hora-texto">{horario.hora}</span>
                <span className="nome-texto">{horario.nome}</span>
                {passou && <span className="check-icon">✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Horarios;