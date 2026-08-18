/**
 * Account information available in markdown via {{$user.email}}, {{$organization.name}}, etc.
 */
export type AccountVariables = {
	user: {
		email: string;
		first_name: string | null;
		last_name: string | null;
		/** Time of day based on client's local time. Only available client-side. */
		time_of_day?: 'Morning' | 'Afternoon' | 'Evening';
	};
	organization: {
		name: string;
	};
};
