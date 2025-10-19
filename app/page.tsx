'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sanity } from './lib/sanity/client';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function Home() {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState('');
  const [name, setName] = useState('');
  const [shop, setShop] = useState('');
  const [defaultLanding, setDefaultLanding] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [sandboxUrl, setSandboxUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatorId, setCreatorId] = useState('');
  const [addCreatorLoading, setAddCreatorLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) return;

    setLoading(true);
    try {
      const existingCampaign = await sanity.fetch(
        `*[_type == "campaign" && campaignId == $campaignId][0]`,
        { campaignId }
      );

      if (existingCampaign) {
        router.push(`/dashboard?campaignId=${campaignId}`);
      } else {
        await sanity.create({
          _type: 'campaign',
          campaignId,
          name: name || campaignId,
          shop,
          defaultLanding,
          enabled,
        });
        router.push(`/dashboard?campaignId=${campaignId}`);
      }
    } catch (error) {
      console.error('Error handling campaign:', error);
      setLoading(false);
    }
  };

  const handleSandboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxUrl) return;
    const params = new URLSearchParams();
    params.set('url', sandboxUrl);
    if (campaignId) {
      params.set('campaignId', campaignId);
    }
    router.push(`/sandbox?${params.toString()}`);
  };

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId || !creatorId) return;

    setAddCreatorLoading(true);
    try {
      const res = await fetch('/api/shopify/panel/creators/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, creatorId }),
      });
      const data = await res.json();
      if (data.ok) {
        setSnack({ open: true, message: 'Creator added successfully!', severity: 'success' });
        setCreatorId('');
      } else {
        setSnack({ open: true, message: data.error || 'Error adding creator', severity: 'error' });
      }
    } catch (error) {
      console.error('Error adding creator:', error);
      setSnack({ open: true, message: 'Error adding creator', severity: 'error' });
    } finally {
      setAddCreatorLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background:
          'radial-gradient(1200px 600px at 20% 0%, rgba(0,153,255,0.25), transparent 70%), ' +
          'radial-gradient(1000px 600px at 80% 20%, rgba(0,51,153,0.25), transparent 70%), ' +
          'linear-gradient(180deg, #05060C 0%, #0B1020 100%)',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(0,153,255,0.08), rgba(41,98,255,0.08), rgba(0,153,255,0.08))',
          animation: 'spin 24s linear infinite',
          opacity: 0.5,
        },
        '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Typography variant="h3" fontWeight={800} sx={{ textAlign: 'center', mb: 4 }}>
          INVERTO
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ sm: 12, md: 6 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.25) 100%)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, color: 'white' }}>
                  Campaign Dashboard
                </Typography>
                <form onSubmit={handleCampaignSubmit}>
                  <TextField
                    label="Campaign ID"
                    fullWidth
                    required
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{ sx: { color: 'white' } }}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                  <TextField
                    label="Name"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{ sx: { color: 'white' } }}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                  <TextField
                    label="Shop"
                    fullWidth
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{ sx: { color: 'white' } }}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                  <TextField
                    label="Default Landing URL"
                    type="url"
                    fullWidth
                    value={defaultLanding}
                    onChange={(e) => setDefaultLanding(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{ sx: { color: 'white' } }}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                  <FormControlLabel
                    control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} color="primary" />}
                    label="Enabled"
                    sx={{ mb: 2 }}
                  />
                  <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
                    {loading ? 'Loading...' : 'Create or Go to Dashboard'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={4} direction="column">
              <Grid>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Sanity Studio
                    </Typography>
                    <Link href="/studio" passHref>
                      <Button variant="contained" fullWidth>
                        Go to Studio
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </Grid>
              <Grid>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Event Tester
                    </Typography>
                    <Link href={`/test-events?campaignId=${campaignId || 'test-campaign'}`} passHref>
                      <Button variant="contained" fullWidth>
                        Go to Event Tester
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </Grid>
              <Grid>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Add Creator
                    </Typography>
                    <form onSubmit={handleAddCreator}>
                      <TextField
                        label="Campaign ID"
                        fullWidth
                        required
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{ sx: { color: 'white' } }}
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                      />
                      <TextField
                        label="Creator ID"
                        fullWidth
                        required
                        value={creatorId}
                        onChange={(e) => setCreatorId(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{ sx: { color: 'white' } }}
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                      />
                      <Button type="submit" variant="contained" fullWidth disabled={addCreatorLoading}>
                        {addCreatorLoading ? 'Adding...' : 'Add Creator'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </Grid>
              <Grid>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.25) 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Sandbox
                    </Typography>
                    <form onSubmit={handleSandboxSubmit}>
                      <TextField
                        label="Sandbox URL"
                        fullWidth
                        required
                        value={sandboxUrl}
                        onChange={(e) => setSandboxUrl(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{ sx: { color: 'white' } }}
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                      />
                      <TextField
                        label="Campaign ID (for Sandbox)"
                        fullWidth
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{ sx: { color: 'white' } }}
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                      />
                      <Button type="submit" variant="contained" fullWidth>
                        Go to Sandbox
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={snack.open} autoHideDuration={6000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
