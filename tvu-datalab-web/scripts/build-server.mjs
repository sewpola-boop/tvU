import {build} from 'esbuild';
await build({stdin:{contents:"export * from './lib/model.ts'; export * from './lib/production-config.ts';",resolveDir:process.cwd(),sourcefile:'production-model.ts'},outfile:'model.bundle.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:['lib/sysop-auth.ts'],outfile:'auth.bundle.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:['lib/table-engine.ts'],outfile:'table.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({entryPoints:['lib/member-auth.ts'],outfile:'member.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({stdin:{contents:"export * from './lib/chat-service.ts'; export * from './lib/data-analysis.ts'; export * from './lib/chat-protocol.ts'; export * from './lib/chat-rate.ts'; export * from './lib/chat-quota.ts';",resolveDir:process.cwd(),sourcefile:'chat-server.ts'},outfile:'chat.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({stdin:{contents:"export * from './lib/access.ts'; export * from './lib/dataset-delete.ts'; export * from './lib/government-api.ts'; export * from './lib/kosis-collector.ts'; export * from './lib/pdf-analysis.ts'; export * from './lib/ai-data-edit.ts';",resolveDir:process.cwd(),sourcefile:'operations.ts'},outfile:'operations.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({entryPoints:['lib/article-comments.ts'],outfile:'comments.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({entryPoints:['lib/api-vault.ts'],outfile:'vault.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({entryPoints:['lib/related-news.ts'],outfile:'news.bundle.mjs',bundle:true,platform:'node',format:'esm'});
