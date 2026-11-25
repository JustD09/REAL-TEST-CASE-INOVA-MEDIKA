import { Box, Skeleton, Card, CardContent } from '@mui/material';

export function SkeletonCard({ variant = 'default', lines = 3 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={14} />
          </Box>
        </Box>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width="100%" height={16} sx={{ mb: 1 }} />
        ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonStatCard() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Skeleton width="80%" height={16} sx={{ mb: 1 }} />
            <Skeleton width="40%" height={28} sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton width={100} height={24} variant="rounded" />
              <Skeleton width={80} height={24} variant="rounded" />
            </Box>
          </Box>
          <Skeleton variant="circular" width={48} height={48} />
        </Box>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <Card>
      <Box component="table" sx={{ width: '100%' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} sx={{ px: 2, py: 1, textAlign: 'left' }}>
                <Skeleton width="80%" height={16} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} sx={{ px: 2, py: 1 }}>
                  <Skeleton width="100%" height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Card>
  );
}

export function SkeletonChart({ height = 300 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton width="60%" height={24} sx={{ mb: 3 }} />
        <Skeleton width="100%" height={height} variant="rounded" />
      </CardContent>
    </Card>
  );
}

export function SkeletonDashboard() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Skeleton width="30%" height={32} sx={{ mb: 1 }} />
          <Skeleton width="50%" height={20} />
        </Box>
        <Skeleton width={44} height={44} variant="rounded" />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} sm={6} lg={4} xl={2} key={i}>
            <SkeletonStatCard />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <SkeletonChart height={350} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <SkeletonChart height={350} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <SkeletonChart height={300} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <SkeletonChart height={300} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={7}>
          <SkeletonTable rows={8} columns={6} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <SkeletonCard variant="default" lines={8} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <SkeletonCard lines={4} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <SkeletonCard lines={4} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <SkeletonCard lines={4} />
        </Grid>
      </Grid>
    </Box>
  );
}