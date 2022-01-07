const express = require('express');
const cors = require('cors');

 const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

//Middleware para verificar se o usuário informado está cadastrado
function checksExistsUserAccount(request, response, next) {

  //Buscando o 'username' informado no cabeçalho da requisição
  const { username } = request.headers;

  //Verificando nos usuários cadastrado se existe um registro com o 'username' informado
  const user = users.find(user => user.username === username);

  //Caso não encontrar o usuário informado, retorna mensagem de erro
  if(!user){
    return response.status(404).json({"error": "User not found"});
  }

  //Setando o usuário no request para as rotas que utilizam o middleware acessarem essa informação
  request.user = user;

  return next();
}

//Criação de usuário
app.post('/users', (request, response) => {

  //Carregando as informações passadas via requisição
  const { name, username } = request.body;

  //Verificando se já existe um usuário com o 'username' informado
  const userAlreadyExists = users.some(
    (user) => user.username === username
  );

  if(userAlreadyExists){
    return response.status(400).json({"error": "Username already used"});
  }

  const userNew = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(userNew);

  return response.status(201).json(userNew);
});

//Listagem dos todos de um usuário
app.get('/todos', checksExistsUserAccount, (request, response) => {
  
  //Carregando o usuário setado no middleware
  const { user } = request;

  //Retornando os todos do usuário selecionado
  return response.json(user.todos);
});

//Cadastro de tarefa de um usuário
app.post('/todos', checksExistsUserAccount, (request, response) => {
  
  //Carregando as informações enviadas via requisição
  const { title, deadline } = request.body;

  //Carregando o usuário selecionado
  const { user } = request;

  //Criando o objeto da tarefa
  const todoInfo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  //Adicionando a tarefa ao array de todos do usuário
  user.todos.push(todoInfo);

  return response.status(201).json(todoInfo);
});

//Atualizando propriedades de uma tarefa
app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  
  //Carregando as informações enviadas via requisição
  const { title, deadline } = request.body;
  const { id } = request.params;

  //Carregando o usuário
  const { user } = request;

  //Buscando o todo pelo id informado
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo){
    return response.status(404).json({"error": "Todo not found"});
  }

  //Setando o title e o deadline informados
  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

//Alterando a propriedade 'done' de um todo
app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  
  //Carregando o id informado na requisição
  const { id } = request.params;

  //Carregando o usuário
  const { user } = request;

  //Buscando o todo pelo id informado
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo){
    return response.status(404).json({"error": "Todo not found"});
  }

  //Setando a propriedade 'done' como true
  todo.done = true;

  return response.json(todo);
});

//Excluindo um todo
app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  
  //Carregando o id informado na requisição
  const { id } = request.params;

  //Carregando o usuário
  const { user } = request;

  //Buscando o todo pelo id informado
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo){
    return response.status(404).json({"error": "Todo not found"});
  }

  //Removendo do array de todos do usuário o todo informado
  user.todos.splice(todo, 1);

  return response.status(204).send();
});

module.exports = app;