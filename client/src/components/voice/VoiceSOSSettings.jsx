import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mic, MicOff, Plus, X, AlertCircle } from 'lucide-react';
import {
  getVoiceSettings,
  updateVoiceSettings,
  addVoiceKeyword,
  removeVoiceKeyword,
} from '@/api/voice.api';
import { Toggle, Spinner } from '@/components/ui';

const SENSITIVITY_OPTIONS = [
  { value: 'low',    label: 'Low',    desc: 'Any match (more sensitive)' },
  { value: 'medium', label: 'Medium', desc: '65% confidence (recommended)' },
  { value: 'high',   label: 'High',   desc: '80% confidence (fewer false positives)' },
];

const isVoiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * VoiceSOSSettings — shown as a card on ProfilePage.
 * Exposes toggle, sensitivity, keyword management.
 *
 * @param {{ isListening: boolean }} props
 */
const VoiceSOSSettings = ({ isListening = false }) => {
  const queryClient = useQueryClient();
  const [newKeyword, setNewKeyword] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // ─── Fetch combined settings + keywords ─────────────────────────────
  const { data: settings, isLoading } = useQuery({
    queryKey: ['voice', 'settings'],
    queryFn:  getVoiceSettings,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['voice', 'settings'] });

  // ─── Update settings ─────────────────────────────────────────────────
  const { mutate: saveSettings, isPending: savingSettings } = useMutation({
    mutationFn: updateVoiceSettings,
    onSuccess: invalidate,
    onError: () => toast.error('Failed to update voice settings'),
  });

  // ─── Add keyword ─────────────────────────────────────────────────────
  const { mutate: addKw, isPending: addingKw } = useMutation({
    mutationFn: (kw) => addVoiceKeyword(kw),
    onSuccess: () => { setNewKeyword(''); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add keyword'),
  });

  // ─── Remove keyword ──────────────────────────────────────────────────
  const { mutate: removeKw } = useMutation({
    mutationFn: removeVoiceKeyword,
    onSuccess: invalidate,
    onError: (err) => toast.error(err.response?.data?.message || 'Cannot delete last keyword'),
  });

  const handleToggle = (val) => {
    saveSettings({
      is_enabled:  val,
      sensitivity: settings?.sensitivity || 'medium',
    });
  };

  const handleSensitivity = (val) => {
    saveSettings({
      is_enabled:  settings?.is_enabled ?? false,
      sensitivity: val,
    });
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    const kw = newKeyword.trim();
    if (!kw || kw.length < 2) return;
    addKw(kw);
  };

  const keywords = settings?.keywords ?? [];
  const isEnabled = settings?.is_enabled ?? false;

  return (
    <div className="flex flex-col gap-4">

      {/* Browser support warning */}
      {!isVoiceSupported && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Voice SOS requires <strong>Chrome</strong> or <strong>Edge</strong> browser.
            Your current browser does not support the Web Speech API.
          </p>
        </div>
      )}

      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">Enable voice trigger</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Speaks a keyword to silently fire SOS
          </p>
        </div>
        {savingSettings
          ? <Spinner size="sm" />
          : <Toggle
              checked={isEnabled}
              onChange={isVoiceSupported ? handleToggle : () => toast.error('Voice SOS requires Chrome or Edge')}
            />
        }
      </div>

      {/* Listening status */}
      {isEnabled && isListening && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-emerald-700">Listening for keywords…</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}

      {/* Detail settings — only shown when enabled */}
      {isEnabled && !isLoading && (
        <>
          {/* Sensitivity */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Sensitivity</p>
            <div className="grid grid-cols-3 gap-2">
              {SENSITIVITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSensitivity(opt.value)}
                  className={`flex flex-col gap-0.5 px-2 py-2.5 rounded-xl border text-center transition-all ${
                    settings?.sensitivity === opt.value
                      ? 'bg-[#E53E6D] text-white border-[#E53E6D] shadow-md shadow-rose-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                  <span className={`text-[10px] leading-tight ${settings?.sensitivity === opt.value ? 'text-rose-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">Trigger keywords</p>
              <span className="text-xs text-slate-400">{keywords.length}/10</span>
            </div>

            {/* Keyword chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.map((kw) => {
                const id     = kw.id;
                const label  = typeof kw === 'string' ? kw : kw.keyword;
                return (
                  <span
                    key={id || label}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#FCE4ED] text-[#C0304F] text-xs font-semibold rounded-full"
                  >
                    {label}
                    <button
                      onClick={() => removeKw(id)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#E53E6D]/20 transition-colors"
                      aria-label={`Remove keyword ${label}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}

              {keywords.length === 0 && (
                <p className="text-xs text-slate-400 italic">No keywords. Add one below.</p>
              )}
            </div>

            {/* Add keyword input */}
            {keywords.length < 10 && (
              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <input
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="e.g. help, bachao…"
                  maxLength={50}
                  className={`flex-1 border rounded-xl px-3 py-2 text-sm outline-none transition-all placeholder:text-slate-400 ${
                    inputFocused
                      ? 'border-[#E53E6D] ring-2 ring-[#E53E6D]/20'
                      : 'border-slate-200'
                  }`}
                />
                <button
                  type="submit"
                  disabled={addingKw || !newKeyword.trim() || newKeyword.trim().length < 2}
                  className="flex items-center gap-1 px-3 py-2 bg-[#E53E6D] text-white rounded-xl text-sm font-semibold hover:bg-[#C0304F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingKw ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceSOSSettings;
