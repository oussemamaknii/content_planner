<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <div class="p-4 border-b border-gray-200 flex items-center gap-4">
        <WorkspaceSelect />
        <div class="flex-1">
          <NavBar />
        </div>
      </div>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
