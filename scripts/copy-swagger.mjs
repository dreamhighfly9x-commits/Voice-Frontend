import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require=createRequire(import.meta.url);
const source=dirname(require.resolve('swagger-ui-dist/package.json'));
const target=new URL('../public/swagger/',import.meta.url);
await mkdir(target,{recursive:true});
for(const filename of ['swagger-ui.css','swagger-ui-bundle.js','swagger-ui-standalone-preset.js','LICENSE']) {
  await copyFile(join(source,filename),new URL(filename,target));
}
