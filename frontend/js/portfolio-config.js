const portfolioConfig = Object.freeze({
  name: 'Manav Agarwal',
  role: 'Creative Frontend Developer',
  location: 'Hyderabad, India',
  availability: 'Open to junior frontend roles and freelance projects',
  email: 'monographicalpixel@gmail.com',
  githubUrl: 'https://github.com/manav193',
  linkedinUrl: null,
  resumePath: 'Manav-Agarwal-Resume.pdf',
  deployedPortfolioUrl: 'https://my-portfolio-mu-jade-52.vercel.app',
  socialImagePath: 'assets/manav-agarwal-portfolio-og.jpg',
  featuredProjectIds: [
    'arcade-os',
    'nimo',
    'toolverse',
    'selfyy',
    'shift-zero',
    'love',
    'velora-bites',
    'nintendo',
    'nike'
  ],
  projects: Object.freeze({
    'arcade-os': Object.freeze({
      status: 'Live',
      liveUrl: '#intro-sequence',
      githubUrl: 'https://github.com/manav193/MY-PORTFOLIO',
      caseStudyPath: 'project-arcade-os.html'
    }),
    nimo: Object.freeze({
      status: 'Live',
      liveUrl: '#nimo-widget',
      githubUrl: 'https://github.com/manav193/MY-PORTFOLIO',
      caseStudyPath: 'project-nimo.html'
    }),
    toolverse: Object.freeze({
      status: 'Live',
      liveUrl: 'https://tool-verse-theta.vercel.app/',
      githubUrl: 'https://github.com/manav193/ToolVerse',
      caseStudyPath: 'project-toolverse.html'
    }),
    selfyy: Object.freeze({
      status: 'Live',
      liveUrl: 'https://selfyy.vercel.app/',
      githubUrl: 'https://github.com/manav193/SELFYY',
      caseStudyPath: 'project-selfyy.html'
    }),
    'shift-zero': Object.freeze({
      status: 'In Development',
      liveUrl: null,
      githubUrl: 'https://github.com/manav193/SHIFT-ZERO',
      caseStudyPath: 'project-shift-zero.html'
    }),
    love: Object.freeze({
      status: 'Archived',
      liveUrl: null,
      githubUrl: 'https://github.com/manav193/LOVE',
      caseStudyPath: 'project-love-journey.html'
    }),
    'velora-bites': Object.freeze({
      status: 'Prototype',
      liveUrl: null,
      githubUrl: 'https://github.com/manav193/VELORA-BITES-UI',
      caseStudyPath: 'project-velora-bites.html'
    }),
    nintendo: Object.freeze({
      status: 'Prototype',
      liveUrl: null,
      githubUrl: 'https://github.com/manav193/NITENDO-UI',
      caseStudyPath: 'project-nintendo.html'
    }),
    nike: Object.freeze({
      status: 'Prototype',
      liveUrl: null,
      githubUrl: 'https://github.com/manav193',
      caseStudyPath: 'project-nike.html'
    })
  })
});

module.exports = portfolioConfig;
