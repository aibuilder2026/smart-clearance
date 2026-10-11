<script lang="ts">
	// an SKU's gate in the SKU table: its own value in the primary ink with "this SKU" under it, the client's default in
	// the secondary ink with "default", never told apart by colour alone (SC-47)
	let { value, own }: { value: string; own: boolean } = $props();
</script>

<span class="cs-gval {own ? 'own' : 'def'}"><b>{value}</b><span class="d">{own ? 'this SKU' : 'default'}</span></span>
