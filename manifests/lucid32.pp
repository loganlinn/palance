# Basic Puppet Apache manifest

class lucid32 {
	group { 'puppet': ensure => 'present' }

	exec { 'apt-get update':
		command => '/usr/bin/apt-get update'
	}

	package { 'apache2':
		ensure  => present,
		require => Exec['apt-get update']
	}

	service { "apache2":
		ensure   => running,
		require => Package["apache2"]
	}
}

include lucid32
