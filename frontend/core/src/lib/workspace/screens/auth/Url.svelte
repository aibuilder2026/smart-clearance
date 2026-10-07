<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { WS } from '../../data';
</script>

<!-- the workspace's address, with its padlock (screens/auth.jsx Url) -->
<span class="si-url"><Icon name="lock" size={12} stroke={2.2} />{WS.domain}</span>
