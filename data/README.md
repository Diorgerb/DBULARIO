# CSV de bulas

O servidor espera encontrar o arquivo `StatusBulasANVISA.csv` em um destes caminhos:

- Variável de ambiente `CSV_PATH` (pode ser absoluto ou relativo ao diretório atual).
- Caminho padrão: `data/StatusBulasANVISA.csv` relativo ao diretório de execução (`process.cwd()`).

## Build/Deploy

O script de build copia o arquivo para `dist/data/StatusBulasANVISA.csv` para facilitar o deploy.
Se você publicar apenas a pasta `dist`, configure `CSV_PATH=dist/data/StatusBulasANVISA.csv` ou
monte um volume contendo `data/StatusBulasANVISA.csv` no diretório de execução.
