import {build} from 'esbuild';
await build({entryPoints:['lib/model.ts'],outfile:'model.bundle.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:['lib/sysop-auth.ts'],outfile:'auth.bundle.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:['lib/table-engine.ts'],outfile:'table.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({entryPoints:['lib/member-auth.ts'],outfile:'member.bundle.mjs',bundle:true,platform:'node',format:'esm'});

await build({stdin:{contents:"export * from './lib/chat-service.ts'; export * from './lib/chat-protocol.ts'; export * from './lib/chat-rate.ts';",resolveDir:process.cwd(),sourcefile:'chat-server.ts'},outfile:'chat.bundle.mjs',bundle:true,platform:'node',format:'esm'});
