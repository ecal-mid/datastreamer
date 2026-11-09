"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show plugin UI with a compact telemetry HUD
figma.showUI(__html__, {
    width: 330,
    height: 480,
    title: 'SimData Bridge'
});
let cached = null;
function getOrInitBioCollection() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cached && cached.collection) {
            return cached;
        }
        try {
            let collections = [];
            if (typeof figma.variables.getLocalVariableCollectionsAsync === 'function') {
                collections = yield figma.variables.getLocalVariableCollectionsAsync();
            }
            else if (typeof figma.variables.getLocalVariableCollections === 'function') {
                collections = figma.variables.getLocalVariableCollections();
            }
            let bioCollection = collections.find(c => c.name === 'BioData');
            if (!bioCollection) {
                bioCollection = figma.variables.createVariableCollection('BioData');
            }
            const defaultModeId = bioCollection.defaultModeId;
            const variableMap = {};
            // Get all variables in collection
            for (const varId of bioCollection.variableIds) {
                let v = null;
                if (typeof figma.variables.getVariableByIdAsync === 'function') {
                    v = yield figma.variables.getVariableByIdAsync(varId);
                }
                else if (typeof figma.variables.getVariableById === 'function') {
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
        }
        catch (err) {
            console.error('[SimData] Error fetching collections:', err);
            return null;
        }
    });
}
function setupBioVariables() {
    return __awaiter(this, void 0, void 0, function* () {
        const cache = yield getOrInitBioCollection();
        if (!cache || !cache.collection) {
            figma.ui.postMessage({ type: 'SETUP_ERROR', message: 'Could not access Figma Variables API.' });
            return;
        }
        const desiredVariables = [
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
            }
            else {
                // Refresh default initial value
                try {
                    variable.setValueForMode(cache.defaultModeId, def.initial);
                }
                catch (e) { }
            }
        }
        figma.notify(`SimData: Provisioned 6 bio variables in "BioData" collection!`);
        figma.ui.postMessage({
            type: 'SETUP_SUCCESS',
            collectionName: 'BioData',
            createdCount,
            variables: Object.keys(cache.variables)
        });
    });
}
function applyBioTelemetry(data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const cache = yield getOrInitBioCollection();
        if (!cache || !cache.collection)
            return;
        const vars = cache.variables;
        const modeId = cache.defaultModeId;
        try {
            if (vars['bio_alpha'] && ((_b = (_a = data.biometrics) === null || _a === void 0 ? void 0 : _a.eeg) === null || _b === void 0 ? void 0 : _b.alpha) !== undefined) {
                vars['bio_alpha'].setValueForMode(modeId, Number(data.biometrics.eeg.alpha));
            }
            if (vars['bio_beta'] && ((_d = (_c = data.biometrics) === null || _c === void 0 ? void 0 : _c.eeg) === null || _d === void 0 ? void 0 : _d.beta) !== undefined) {
                vars['bio_beta'].setValueForMode(modeId, Number(data.biometrics.eeg.beta));
            }
            if (vars['bio_coherence'] && ((_f = (_e = data.biometrics) === null || _e === void 0 ? void 0 : _e.hrv) === null || _f === void 0 ? void 0 : _f.coherence) !== undefined) {
                vars['bio_coherence'].setValueForMode(modeId, Number(data.biometrics.hrv.coherence));
            }
            if (vars['bio_bpm'] && ((_h = (_g = data.biometrics) === null || _g === void 0 ? void 0 : _g.hrv) === null || _h === void 0 ? void 0 : _h.bpm) !== undefined) {
                vars['bio_bpm'].setValueForMode(modeId, Number(data.biometrics.hrv.bpm));
            }
            if (vars['bio_respiration'] && ((_k = (_j = data.biometrics) === null || _j === void 0 ? void 0 : _j.respiration) === null || _k === void 0 ? void 0 : _k.value) !== undefined) {
                vars['bio_respiration'].setValueForMode(modeId, Number(data.biometrics.respiration.value));
            }
            if (vars['bio_artifact'] && ((_l = data.states) === null || _l === void 0 ? void 0 : _l.artifact_flag) !== undefined) {
                vars['bio_artifact'].setValueForMode(modeId, Boolean(data.states.artifact_flag));
            }
        }
        catch (err) {
            // Suppress individual frame write errors to prevent interrupting the stream
        }
    });
}
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'SETUP_VARIABLES') {
        yield setupBioVariables();
    }
    else if (msg.type === 'BIO_UPDATE') {
        yield applyBioTelemetry(msg.data);
    }
    else if (msg.type === 'RELOAD_CACHE') {
        cached = null;
        yield getOrInitBioCollection();
    }
});
