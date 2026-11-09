/// <reference types="@figma/plugin-typings" />

// Show plugin UI with a compact telemetry HUD
figma.showUI(__html__, {
  width: 330,
  height: 480,
  title: 'SimData Bridge'
});

interface VariableCache {
  collection: VariableCollection | null;
  defaultModeId: string;
  variables: Record<string, Variable>;
}

let cached: VariableCache | null = null;

async function getOrInitBioCollection(): Promise<VariableCache | null> {
  if (cached && cached.collection) {
    return cached;
  }

  try {
    let collections: VariableCollection[] = [];
    if (typeof figma.variables.getLocalVariableCollectionsAsync === 'function') {
      collections = await figma.variables.getLocalVariableCollectionsAsync();
    } else if (typeof figma.variables.getLocalVariableCollections === 'function') {
      collections = figma.variables.getLocalVariableCollections();
    }

    let bioCollection = collections.find(c => c.name === 'BioData');
    if (!bioCollection) {
      bioCollection = figma.variables.createVariableCollection('BioData');
    }

    const defaultModeId = bioCollection.defaultModeId;
    const variableMap: Record<string, Variable> = {};

    // Get all variables in collection
    for (const varId of bioCollection.variableIds) {
      let v: Variable | null = null;
      if (typeof figma.variables.getVariableByIdAsync === 'function') {
        v = await figma.variables.getVariableByIdAsync(varId);
      } else if (typeof figma.variables.getVariableById === 'function') {
        v = figma.variables.getVariableById(varId);
      }
      if (v) {
        variableMap[v.name] = v;
      }
    }

    cached = {
      collection: bioCollection,
      defaultModeId,
      variables: variableMap,
    };

    return cached;
  } catch (err) {
    console.error('[SimData] Error fetching collections:', err);
    return null;
  }
}

async function setupBioVariables() {
  const cache = await getOrInitBioCollection();
  if (!cache || !cache.collection) {
    figma.ui.postMessage({ type: 'SETUP_ERROR', message: 'Could not access Figma Variables API.' });
    return;
  }

  const desiredVariables: Array<{ name: string; type: VariableResolvedDataType; initial: number | boolean }> = [
    { name: 'bio_alpha', type: 'FLOAT', initial: 0.5 },
    { name: 'bio_beta', type: 'FLOAT', initial: 0.2 },
    { name: 'bio_coherence', type: 'FLOAT', initial: 0.5 },
    { name: 'bio_bpm', type: 'FLOAT', initial: 70.0 },
    { name: 'bio_respiration', type: 'FLOAT', initial: 0.5 },
    { name: 'bio_artifact', type: 'BOOLEAN', initial: false },
  ];

  let createdCount = 0;
  for (const def of desiredVariables) {
    let variable = cache.variables[def.name];
    if (!variable) {
      variable = figma.variables.createVariable(def.name, cache.collection, def.type);
      variable.setValueForMode(cache.defaultModeId, def.initial);
      cache.variables[def.name] = variable;
      createdCount++;
    } else {
      // Refresh default initial value
      try {
        variable.setValueForMode(cache.defaultModeId, def.initial);
      } catch (e) {}
    }
  }

  figma.notify(`SimData: Provisioned 6 bio variables in "BioData" collection!`);
  figma.ui.postMessage({
    type: 'SETUP_SUCCESS',
    collectionName: 'BioData',
    createdCount,
    variables: Object.keys(cache.variables)
  });
}

async function applyBioTelemetry(data: any) {
  const cache = await getOrInitBioCollection();
  if (!cache || !cache.collection) return;

  const vars = cache.variables;
  const modeId = cache.defaultModeId;

  try {
    if (vars['bio_alpha'] && data.biometrics?.eeg?.alpha !== undefined) {
      vars['bio_alpha'].setValueForMode(modeId, Number(data.biometrics.eeg.alpha));
    }
    if (vars['bio_beta'] && data.biometrics?.eeg?.beta !== undefined) {
      vars['bio_beta'].setValueForMode(modeId, Number(data.biometrics.eeg.beta));
    }
    if (vars['bio_coherence'] && data.biometrics?.hrv?.coherence !== undefined) {
      vars['bio_coherence'].setValueForMode(modeId, Number(data.biometrics.hrv.coherence));
    }
    if (vars['bio_bpm'] && data.biometrics?.hrv?.bpm !== undefined) {
      vars['bio_bpm'].setValueForMode(modeId, Number(data.biometrics.hrv.bpm));
    }
    if (vars['bio_respiration'] && data.biometrics?.respiration?.value !== undefined) {
      vars['bio_respiration'].setValueForMode(modeId, Number(data.biometrics.respiration.value));
    }
    if (vars['bio_artifact'] && data.states?.artifact_flag !== undefined) {
      vars['bio_artifact'].setValueForMode(modeId, Boolean(data.states.artifact_flag));
    }
  } catch (err) {
    // Suppress individual frame write errors to prevent interrupting the stream
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'SETUP_VARIABLES') {
    await setupBioVariables();
  } else if (msg.type === 'BIO_UPDATE') {
    await applyBioTelemetry(msg.data);
  } else if (msg.type === 'RELOAD_CACHE') {
    cached = null;
    await getOrInitBioCollection();
  }
};

