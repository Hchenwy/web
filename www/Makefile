#ifndef CROSS
#CC		=	gcc
#STRIP	=	strip
#else 
#CC		=	$(CROSS)-gcc
#AR		=	$(CROSS)-ar
#STRIP   =	$(CROSS)-strip
#endif

#LDFLAGS  += -lpthread -lm -lrt

#P_NAME   = snmp_ipmac
#SRCDIR   = .
#SRCS    := $(shell find $(SRCDIR) -name '*.c')
#P_OBJS  =  $(patsubst %.c, %.o, $(SRCS))

#all: $(P_NAME)
all:

#$(P_NAME): clean $(P_OBJS)
#	$(CC) $(CFLAGS) $(P_OBJS) $(LDFLAGS) -o $(P_NAME)

clean:
#	rm -rf $(CURDIR)/*.o
#	rm -rf $(P_NAME)
	
install:
#	chmod 777 $(P_NAME)
#	cp $(P_NAME) $(ROOT)/usr/sbin/
#	cp snmp_ipmac.json $(ROOT)/etc/
#	$echo $(SVN_VERSION)
#	sh build.sh $(SVN_VERSION) $(ROOT)
	cp ./cmsrestart.sh $(ROOT)/usr/sbin
	sh build.sh  $(ROOT) $(BOARD_TYPE)

