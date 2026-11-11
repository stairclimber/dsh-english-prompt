/**
 * English Prompt — Client half.
 *
 * Adds the circled-T control immediately to the right of the model selector.
 * Clicking it opens a small settings panel above the composer, matching the
 * model-selection menu: a Prompt Translation switch and the model + reasoning
 * effort the plugin currently uses. The mark itself is blue while prompt
 * translation is on — the same blue as the composer's send button — and black
 * while it is off.
 */
window.__ModuleLoader__.load({
	id: '@local/english-prompt',
	factory(require) {
		const React = require('react');
		const h = React.createElement;
		const { createPortal } = require('react-dom');

		const NS = 'english-prompt';
		const API = '/english-prompt/';
		/** Panel width in CSS pixels, matching the model menu's compact width. */
		const PANEL_WIDTH = 268;

		const DICTIONARIES = {
			en: {
				'button.label': 'English Prompt settings',
				'panel.promptTranslation': 'Prompt Translation',
				'panel.model': 'Model',
				'panel.loading': 'Loading…',
				'panel.unavailable': 'Unavailable'
			},
			zh: {
				'button.label': '英文提示词设置',
				'panel.promptTranslation': '提示词翻译',
				'panel.model': '模型',
				'panel.loading': '加载中…',
				'panel.unavailable': '不可用'
			}
		};

		const CSS = [
			'.ep-button{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:26px;height:26px;margin-left:2px;padding:0;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;appearance:none;-webkit-appearance:none;transition:background-color .15s ease,color .15s ease}',
			'.ep-button:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}',
			'.ep-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
			'.ep-button.ep-on{color:var(--dsw-alias-button-info-fill,#4176e6)}',
			'.ep-button.ep-open{background:var(--dsw-alias-bg-layer-2)}',
			'.ep-panel{position:fixed;z-index:1100;box-sizing:border-box;width:268px;padding:4px;border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-menu-surface-fill,rgba(252,253,254,.7));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(1.5));box-shadow:var(--dsw-elevation-prominent,0 0 0 .5px rgba(0,0,0,.04),0 3px 8px 0 rgba(0,0,0,.04),0 0 20px 0 rgba(0,0,0,.05));color:var(--dsw-alias-label-primary);animation:ep-panel-in .12s ease-out}',
			'@keyframes ep-panel-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
			'@media (prefers-reduced-motion: reduce){.ep-panel{animation:none}}',
			'.ep-cell{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;height:34px;padding:0 8px;border-radius:var(--dsw-radius-md,12px);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;text-align:left}',
			'.ep-cell-action{cursor:pointer;transition:background-color .1s ease}',
			'.ep-cell-action:hover{background:var(--dsw-alias-interactive-bg-hover)}',
			'.ep-cell-label{flex:0 0 auto;white-space:nowrap}',
			'.ep-cell-spacer{flex:1 1 auto}',
			'.ep-cell-value{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--dsw-alias-label-tertiary)}',
			'.ep-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);cursor:pointer;outline-offset:2px}',
			'.ep-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary)}',
			'.ep-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
			'.ep-switch[aria-disabled="true"]{cursor:default;opacity:.5}',
			'.ep-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb);transition:transform .12s}',
			'.ep-switch[aria-checked="true"] .ep-thumb{background:var(--dsw-alias-label-primary-foreground);transform:translateX(16px)}'
		].join('');

		/** Resolve one localized string. */
		function label(t, key) {
			let text;
			try {
				text = typeof t === 'function' ? t(key) : key;
			} catch {
				text = key;
			}
			if (typeof text !== 'string' || text === '' || text === key) text = DICTIONARIES.en[key] ?? key;
			return text;
		}

		/** Read one JSON payload from the Host half. */
		async function getJson(url) {
			const response = await fetch(url, {
				method: 'GET',
				headers: { accept: 'application/json' },
				cache: 'no-store',
				credentials: 'same-origin'
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				payload = undefined;
			}
			if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`);
			return payload;
		}

		/** Write the per-Session switch and return the fresh state. */
		async function postToggle(sessionId, enabled) {
			const response = await fetch(`${API}toggle?sessionId=${encodeURIComponent(sessionId)}&enabled=${enabled ? '1' : '0'}`, {
				method: 'POST',
				headers: { accept: 'application/json' },
				cache: 'no-store',
				credentials: 'same-origin'
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				payload = undefined;
			}
			if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`);
			return payload;
		}

		/** The black-line circled-T mark; its color follows the button. */
		function Mark() {
			return h(
				'svg',
				{
					viewBox: '0 0 24 24',
					width: 18,
					height: 18,
					fill: 'none',
					stroke: 'currentColor',
					strokeWidth: 1.7,
					strokeLinecap: 'round',
					strokeLinejoin: 'round',
					'aria-hidden': true,
					focusable: false
				},
				h('circle', { cx: 12, cy: 12, r: 8.1 }),
				h('path', { d: 'M8.4 9.05h7.2' }),
				h('path', { d: 'M12 9.05v6.7' })
			);
		}

		/**
		 * Composer control placed between the model selector and Send.
		 * @param props - slot props plus the standard Session identity.
		 * @returns the trigger and its settings panel.
		 */
		function ToggleButton(props) {
			const sessionId = props.sessionId;
			const t = props.t;
			const [state, setState] = React.useState({ phase: 'loading' });
			const [pending, setPending] = React.useState(false);
			const [open, setOpen] = React.useState(false);
			const [panelStyle, setPanelStyle] = React.useState(null);
			const buttonRef = React.useRef(null);
			const panelRef = React.useRef(null);

			const refresh = React.useCallback(() => {
				if (typeof sessionId !== 'string' || sessionId === '') return () => {};
				let cancelled = false;
				setState((current) => (current.phase === 'ready' ? current : { phase: 'loading' }));
				getJson(`${API}state?sessionId=${encodeURIComponent(sessionId)}`)
					.then((value) => {
						if (!cancelled) setState({ phase: 'ready', value });
					})
					.catch(() => {
						if (!cancelled) setState({ phase: 'error' });
					});
				return () => {
					cancelled = true;
				};
			}, [sessionId]);

			React.useEffect(() => refresh(), [refresh]);

			React.useEffect(() => {
				setOpen(false);
			}, [sessionId]);

			React.useEffect(() => {
				if (!open) return undefined;
				const onPointerDown = (event) => {
					if (buttonRef.current?.contains(event.target) === true) return;
					if (panelRef.current?.contains(event.target) === true) return;
					setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === 'Escape') setOpen(false);
				};
				document.addEventListener('mousedown', onPointerDown, true);
				document.addEventListener('keydown', onKeyDown, true);
				return () => {
					document.removeEventListener('mousedown', onPointerDown, true);
					document.removeEventListener('keydown', onKeyDown, true);
				};
			}, [open]);

			const toggle = React.useCallback(async () => {
				if (typeof sessionId !== 'string' || sessionId === '' || pending) return;
				const current = state.phase === 'ready' ? state.value.enabled !== false : true;
				setPending(true);
				try {
					const value = await postToggle(sessionId, !current);
					setState({ phase: 'ready', value });
				} catch {
					setState({ phase: 'error' });
				} finally {
					setPending(false);
				}
			}, [sessionId, state, pending]);

			const openPanel = React.useCallback(() => {
				const rect = buttonRef.current?.getBoundingClientRect();
				if (rect !== undefined) {
					const left = Math.max(8, Math.min(Math.round(rect.right) - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8));
					const bottom = Math.max(8, Math.round(window.innerHeight - rect.top) + 8);
					setPanelStyle({ left: `${left}px`, bottom: `${bottom}px` });
				}
				setOpen(true);
				refresh();
			}, [refresh]);

			if (typeof sessionId !== 'string' || sessionId === '') return null;

			const ready = state.phase === 'ready';
			const enabled = ready ? state.value.enabled !== false : true;
			const route = ready ? state.value.route : null;
			const modelText = route === null || route === undefined
				? state.phase === 'error'
					? label(t, 'panel.unavailable')
					: label(t, 'panel.loading')
				: [route.name || route.model, route.effort?.name].filter((part) => typeof part === 'string' && part !== '').join(' · ');
			const triggerLabel = label(t, 'button.label');

			const panel = open
				? h(
						'div',
						{
							ref: panelRef,
							className: 'ep-panel',
							role: 'dialog',
							'aria-label': triggerLabel,
							style: panelStyle ?? undefined
						},
						h(
							'div',
							{ className: 'ep-cell ep-cell-action', onClick: toggle },
							h('span', { className: 'ep-cell-label' }, label(t, 'panel.promptTranslation')),
							h('span', { className: 'ep-cell-spacer' }),
							h(
								'span',
								{
									role: 'switch',
									tabIndex: 0,
									'aria-checked': enabled,
									'aria-disabled': pending || !ready,
									'aria-label': label(t, 'panel.promptTranslation'),
									className: 'ep-switch',
									onClick: (event) => {
										event.stopPropagation();
										toggle();
									},
									onKeyDown: (event) => {
										if (event.key !== ' ' && event.key !== 'Enter') return;
										event.preventDefault();
										event.stopPropagation();
										toggle();
									}
								},
								h('span', { className: 'ep-thumb' })
							)
						),
						h(
							'div',
							{ className: 'ep-cell' },
							h('span', { className: 'ep-cell-label' }, label(t, 'panel.model')),
							h('span', { className: 'ep-cell-value', title: modelText }, modelText)
						)
					)
				: null;

			return h(
				React.Fragment,
				null,
				h(
					'button',
					{
						ref: buttonRef,
						type: 'button',
						className: ['ep-button', enabled ? 'ep-on' : '', open ? 'ep-open' : ''].filter(Boolean).join(' '),
						title: triggerLabel,
						'aria-label': triggerLabel,
						'aria-haspopup': 'dialog',
						'aria-expanded': open,
						disabled: props.locked === true,
						onClick: () => {
							if (open) setOpen(false);
							else openPanel();
						}
					},
					h(Mark)
				),
				open && createPortal !== undefined && typeof document !== 'undefined' ? createPortal(panel, document.body) : panel
			);
		}

		return {
			inject: ['slots', 'locale'],
			apply(ctx) {
				ctx.effect(
					() => {
						const element = document.createElement('style');
						element.setAttribute('data-plugin', 'english-prompt');
						element.textContent = CSS;
						document.head.appendChild(element);
						return () => {
							element.remove();
						};
					},
					'english-prompt: styles'
				);

				ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), 'english-prompt: locale');

				ctx.slots.inject('conversation.input.activity', () =>
					ctx.slots.register(
						{
							name: 'conversation.input.activity',
							locale: NS
						},
						ToggleButton
					)
				);
			}
		};
	}
});
