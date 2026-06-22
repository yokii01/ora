import { invokeAI } from './aiClient';

const mockUser = { id: 'local-user', full_name: 'Local User', email: 'local@example.com', role: 'admin' };

const STORAGE_PREFIX = 'oras_entity_';

const readItems = (name) => {
	try {
		return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${name}`) || '[]');
	} catch {
		return [];
	}
};

const writeItems = (name, items) => {
	localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(items));
};

const sortItems = (items, sort) => {
	if (!sort) return items;
	const descending = sort.startsWith('-');
	const field = descending ? sort.slice(1) : sort;
	return [...items].sort((a, b) => {
		const left = a[field] ?? '';
		const right = b[field] ?? '';
		return (left > right ? 1 : left < right ? -1 : 0) * (descending ? -1 : 1);
	});
};

const makeEntity = (name) => ({
	list: async (sort, limit) => {
		const items = sortItems(readItems(name), sort);
		return typeof limit === 'number' ? items.slice(0, limit) : items;
	},
	filter: async (criteria = {}, sort, limit) => {
		const items = readItems(name).filter(item =>
			Object.entries(criteria).every(([key, value]) => item[key] === value)
		);
		const sorted = sortItems(items, sort);
		return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
	},
	get: async (id) => readItems(name).find(item => item.id === id) || null,
	create: async (data) => {
		const now = new Date().toISOString();
		const item = {
			id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
			created_date: now,
			updated_date: now,
			...data,
		};
		writeItems(name, [item, ...readItems(name)]);
		return item;
	},
	update: async (id, data) => {
		let updated = null;
		const items = readItems(name).map(item => {
			if (item.id !== id) return item;
			updated = { ...item, ...data, updated_date: new Date().toISOString() };
			return updated;
		});
		writeItems(name, items);
		return updated;
	},
	delete: async (id) => {
		writeItems(name, readItems(name).filter(item => item.id !== id));
		return { id };
	},
});

const entities = new Proxy({}, {
	get: (_, name) => makeEntity(String(name)),
});

const readFileAsDataUrl = (file, onProgress) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onprogress = event => {
		if (event.lengthComputable) onProgress?.({
			loaded: event.loaded,
			total: event.total,
			percent: Math.round((event.loaded / event.total) * 100),
		});
	};
	reader.onerror = () => reject(reader.error || new Error('File upload failed'));
	reader.onload = () => resolve(reader.result);
	reader.readAsDataURL(file);
});

const uploadFile = async ({ file, onProgress }) => {
	if (!file) throw new Error('No file selected');
	const startedAt = performance.now();
	const fileUrl = await readFileAsDataUrl(file, progress => {
		const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.05);
		const speed = progress.loaded / elapsedSeconds;
		const remainingBytes = Math.max(progress.total - progress.loaded, 0);
		onProgress?.({
			...progress,
			speed,
			remainingSeconds: speed > 0 ? remainingBytes / speed : 0,
		});
	});
	onProgress?.({ loaded: file.size, total: file.size, percent: 100, speed: 0, remainingSeconds: 0 });
	return { file_url: fileUrl };
};

const invokeLLM = async ({ prompt, signal, model }) => {
	try {
		const result = await invokeAI({ prompt, model, signal });
		return result.text;
	} catch (e) {
		throw new Error(e.message || 'Network error. Failed to reach the AI service.');
	}
};

export const db = {
	auth: {
		isAuthenticated: async () => true,
		me: async () => mockUser,
		logout: () => {},
		redirectToLogin: () => {},
	},
	entities,
	integrations: {
		Core: {
			UploadFile: uploadFile,
			InvokeLLM: invokeLLM,
		},
	},
};

export const base44 = db;
export default db;
