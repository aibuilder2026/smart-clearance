<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { useWorkspace } from '../../source';

	const ws = useWorkspace();
</script>

<!-- the workspace's address, with its padlock (screens/auth.jsx Url) -->
<span class="si-url"
	><Icon name="lock" size={12} stroke={2.2} />{(ws.publicInfo?.workspace ?? ws.data.workspace).domain}</span
>
