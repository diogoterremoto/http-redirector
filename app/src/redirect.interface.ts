export interface Redirect {
	source: string;
	destination: string;
	type?: 301 | 302;
	cache?: boolean;
}
