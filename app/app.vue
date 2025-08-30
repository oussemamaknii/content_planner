<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <WorkspaceSelect />
      </div>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
