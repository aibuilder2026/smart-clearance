<script lang="ts">
	import Field from '../../src/lib/components/Field.svelte';
	import Input from '../../src/lib/components/Input.svelte';

	let { error = null, help = null }: { error?: string | null; help?: string | null } = $props();
	let value = $state('');
</script>

<Field label="Work email" htmlFor="bd-email" {error} {help}><Input id="bd-email" type="email" bind:value /></Field>
