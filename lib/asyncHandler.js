// Envolve uma rota assíncrona: qualquer erro (ex: falha de conexão com o
// banco) cai no middleware de erro do Express em vez de travar a
// requisição sem resposta.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
