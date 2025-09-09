'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { toPng, toSvg } from 'html-to-image';
import jsonLogic from 'json-logic-js';
import FlowEditor from '@/components/FlowEditor';

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

const SAMPLE = { '==': [ { var: 'temperature' }, 22 ] };

export default function Page() {
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(SAMPLE, null, 2));
  const [importKey, setImportKey] = useState<number>(0);
  const [importedJson, setImportedJson] = useState<any>(SAMPLE);
  const flowRef = useRef<HTMLDivElement>(null);

  const isValidJson = useMemo(() => {
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  }, [jsonText]);

  const handleImportJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      setImportedJson(parsed);
      setImportKey((k) => k + 1);
    } catch {
      alert('Invalid JSON');
    }
  }, [jsonText]);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl('rule.json', url);
    URL.revokeObjectURL(url);
  }, [jsonText]);

  const handleExportPng = useCallback(async () => {
    if (!flowRef.current) return;
    const dataUrl = await toPng(flowRef.current, { cacheBust: true, pixelRatio: 2 });
    downloadDataUrl('workflow.png', dataUrl);
  }, []);

  const handleExportSvg = useCallback(async () => {
    if (!flowRef.current) return;
    const dataUrl = await toSvg(flowRef.current, { cacheBust: true });
    downloadDataUrl('workflow.svg', dataUrl);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr)', gridTemplateColumns: '1fr', gap: 8, padding: 8 }}>
      <header style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>JsonLogic Flow Editor</strong>
        <button onClick={handleImportJson} disabled={!isValidJson} style={{ padding: '6px 10px' }}>Import JSON</button>
        <button onClick={handleExportJson} style={{ padding: '6px 10px' }}>Download JSON</button>
        <button onClick={handleExportPng} style={{ padding: '6px 10px' }}>Download PNG</button>
        <button onClick={handleExportSvg} style={{ padding: '6px 10px' }}>Download SVG</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Validate sample:</label>
          <span style={{ fontSize: 12 }}>
            {(() => {
              try {
                return String(jsonLogic.apply(JSON.parse(jsonText || '{}'), {}));
              } catch {
                return 'invalid JSON';
              }
            })()}
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 8, minHeight: 0 }}>
        <div ref={flowRef} style={{ height: '100%', border: '1px solid #eee', borderRadius: 8, padding: 8, overflow: 'hidden' }}>
          <FlowEditor
            key={importKey}
            initialJson={importedJson}
            onJsonChange={(next) => setJsonText(JSON.stringify(next, null, 2))}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0,1fr)', gap: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>JsonLogic</div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            style={{ width: '100%', height: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, border: '1px solid #eee', borderRadius: 8, padding: 8, resize: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}


