// Aguarda o conteúdo da página carregar
document.addEventListener("DOMContentLoaded", function() {
  
  // Seleciona o header pelo ID que definimos
  const header = document.getElementById('main-header');
  
  // Variável para armazenar a última posição de rolagem
  let lastScrollY = window.scrollY;
  
  // Adiciona o evento de rolagem
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    // Se a rolagem for para baixo, esconde o header
    if (currentScrollY > lastScrollY) {
      header.classList.add('header-hidden');
    } else {
      // Se for para cima, mostra o header
      header.classList.remove('header-hidden');
    }
    
    // Atualiza a última posição de rolagem
    lastScrollY = currentScrollY;
  });
  
});