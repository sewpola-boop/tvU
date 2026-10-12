import previewExact from './preview-exact.json';
import {withGeneralDistrictSlots} from './general-districts';
import {ConfigSchema,type Config} from './model';
// This authorized release copies the full current preview configuration once.
// Production leader profiles (including photos, party and custom colors) always win.
// Runtime files remain untouched until an administrator explicitly saves/publishes.
export function normalizeStoredConfig(input:unknown):Config{
 const saved=ConfigSchema.parse(input);
 if(saved.home.editorRevision>=4)return saved;
 return ConfigSchema.parse({...previewExact,previousProduction:saved.previousProduction||JSON.stringify(input),leaders:saved.leaders,home:{...previewExact.home,editorRevision:4}});
}
