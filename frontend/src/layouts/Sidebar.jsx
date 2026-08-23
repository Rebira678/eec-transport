import {
  Box, Flex, Text, VStack, HStack, Icon, Divider, Avatar,
  Tooltip, Collapse, IconButton,
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  MdDashboard, MdFolder, MdDescription, MdCalendarToday,
  MdTrendingUp, MdFlag, MdInventory, MdAttachMoney,
  MdDirectionsCar, MdBuild, MdGroup, MdWarning, MdBugReport,
  MdGavel, MdRestore, MdForward, MdBarChart, MdAdminPanelSettings,
  MdPeople, MdSettings, MdLogout, MdChevronRight, MdChevronLeft,
  MdPerson,
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard, path: '/dashboard' },
  { divider: 'PORTFOLIO' },
  { label: 'Projects',          icon: MdFolder,       path: '/projects' },
  { label: 'Contracts',         icon: MdDescription,  path: '/contracts' },
  { divider: 'MONITORING' },
  { label: 'Progress',          icon: MdTrendingUp,   path: '/progress' },
  { label: 'Milestones',        icon: MdFlag,         path: '/milestones' },
  { label: 'Deliverables',      icon: MdInventory,    path: '/deliverables' },
  { label: 'Financial',         icon: MdAttachMoney,  path: '/financials' },
  { divider: 'RESOURCES' },
  { label: 'Staffing',          icon: MdPeople,       path: '/resources?type=HUMAN_RESOURCE' },
  { label: 'Vehicles',          icon: MdDirectionsCar,path: '/resources?type=VEHICLE' },
  { label: 'Equipment',         icon: MdBuild,        path: '/resources?type=EQUIPMENT' },
  { divider: 'RISK & ISSUES' },
  { label: 'Risks',             icon: MdWarning,      path: '/risks' },
  { label: 'Issues',            icon: MdBugReport,    path: '/issues' },
  { divider: 'MANAGEMENT' },
  { label: 'Interventions',     icon: MdGavel,        path: '/interventions' },
  { label: 'Recovery Plans',    icon: MdRestore,      path: '/recovery' },
  { label: 'Forward Look',      icon: MdForward,      path: '/forward-look' },
  { divider: 'SYSTEM' },
  { label: 'Users',             icon: MdPeople,       path: '/users', role: ['ADMIN'] },
];

const NavItem = ({ item, collapsed }) => {
  const { user } = useAuth();
  if (item.role && !item.role.includes(user?.role)) return null;
  return (
    <Tooltip label={collapsed ? item.label : ''} placement="right" hasArrow>
      <Box
        as={NavLink}
        to={item.path}
        display="flex"
        alignItems="center"
        gap={3}
        px={collapsed ? 3 : 4}
        py={2.5}
        borderRadius="lg"
        fontSize="sm"
        fontWeight="500"
        color="gray.400"
        textDecoration="none"
        transition="all 0.15s"
        justifyContent={collapsed ? 'center' : 'flex-start'}
        _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
        style={({ isActive }) => isActive ? {
          background: 'rgba(59,130,246,0.15)',
          color: '#60a5fa',
          fontWeight: 600,
          borderLeft: '3px solid #60a5fa',
        } : { borderLeft: '3px solid transparent' }}
      >
        <Icon as={item.icon} boxSize={5} flexShrink={0} />
        {!collapsed && <Text noOfLines={1}>{item.label}</Text>}
      </Box>
    </Tooltip>
  );
};

export const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  return (
    <Flex
      direction="column"
      h="100vh"
      w={collapsed ? '64px' : '240px'}
      bg="gray.900"
      borderRight="1px solid"
      borderColor="whiteAlpha.100"
      position="fixed"
      left={0} top={0} bottom={0}
      transition="width 0.2s ease"
      zIndex={100}
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        align="center"
        justify={collapsed ? 'center' : 'space-between'}
        px={collapsed ? 2 : 4}
        py={4}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        minH="64px"
      >
        {!collapsed && (
          <Box>
            <Text fontSize="xs" color="blue.400" fontWeight="800" textTransform="uppercase" letterSpacing="1.5px" lineHeight="1.2">
              EEC Transport
            </Text>
            <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="1px">
              Planning & Monitoring
            </Text>
          </Box>
        )}
        <IconButton
          icon={<Icon as={collapsed ? MdChevronRight : MdChevronLeft} />}
          size="sm" variant="ghost" color="gray.500"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
        />
      </Flex>

      {/* Navigation */}
      <VStack
        align="stretch"
        spacing={0.5}
        flex={1}
        overflowY="auto"
        px={collapsed ? 1 : 2}
        py={3}
        css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '2px' } }}
      >
        {NAV_ITEMS.map((item, idx) =>
          item.divider ? (
            !collapsed && (
              <Text key={idx} fontSize="9px" color="gray.600" fontWeight="700" textTransform="uppercase"
                letterSpacing="1.5px" px={4} pt={4} pb={1}>
                {item.divider}
              </Text>
            )
          ) : (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          )
        )}
      </VStack>

      {/* User Footer */}
      <Box
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
        px={collapsed ? 2 : 3}
        py={3}
      >
        <Flex align="center" gap={3} justify={collapsed ? 'center' : 'flex-start'}>
          <Avatar size="sm" name={user?.name} bg="blue.600" color="white" />
          {!collapsed && (
            <Box flex={1} minW={0}>
              <Text fontSize="xs" fontWeight="600" color="white" noOfLines={1}>{user?.name}</Text>
              <Text fontSize="10px" color="gray.500" noOfLines={1}>{user?.role?.replace(/_/g, ' ')}</Text>
            </Box>
          )}
          {!collapsed && (
            <Tooltip label="Logout">
              <IconButton icon={<Icon as={MdLogout} />} size="xs" variant="ghost" color="gray.500"
                onClick={logout} aria-label="Logout" _hover={{ color: 'red.400' }} />
            </Tooltip>
          )}
        </Flex>
      </Box>
    </Flex>
  );
};
