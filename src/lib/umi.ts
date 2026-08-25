import "server-only";

/**
 * Fronteira servidor-only para o código da aplicação. Importar isto de um
 * componente cliente quebra o build — que é exatamente o ponto, já que o
 * módulo abaixo lê a chave privada do app.
 */
export * from "./umi-core";
