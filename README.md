# Projeto desenvolvido para teste técnico. 

O projeto visa o desenvolvimento back-end de um serviço que gerencia a leitura individualizada de consumo de água e gás. Para facilitar a coleta da informação, o serviço utilizará IA para obter a medição através da foto de um medidor.

![image](https://github.com/user-attachments/assets/81b8b082-c123-4a16-806d-fa1474397250)

Os endpoints são os seguintes:

- POST: Responsável por receber uma imagem em base 64, consultar o Gemini e retornar a medida lida pela API. A entrada de dados é validada e verifica se já existe uma leitura para aquele cliente naquele mês. Ele retorna um identificador da leitura e o valor lido.

- PATCH: Responsável por corrigir ou confirmar o valor lido pela API. As validações conferem se essa leitura já foi confirmada, se o identificador da leitura existe de fato para então salvar no banco de dados a confirmação do valor lido.

- GET: Responsável por informar todas as leituras de dado cliente informado nos parâmetros da requisição. É possível informar parâmetro opcional para ter acesso somente a um dos dois tipos de leitura possíveis: água ou gás.

## Tecnologias Utilizadas

- NodeJS
- TypeScript
- Express
- Docker
- Google Gemini
- MongoDB
